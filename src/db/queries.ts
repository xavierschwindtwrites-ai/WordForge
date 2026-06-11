// All Inkwell domain logic lives here: projects, sessions, streak math,
// milestone detection, the pace calculator, and analytics aggregation. The
// main process registers thin IPC handlers that call into these functions.

import { dbRun, dbGet, dbAll } from './database';
import { getNanoMode } from './config';
import type {
  Project,
  ProjectProgress,
  ProjectStatus,
  Session,
  Milestone,
  NewProjectInput,
  UpdateProjectInput,
  NewSessionInput,
  StreakInfo,
  DashboardData,
  AnalyticsData,
  SessionResult,
  DayCount,
  MonthlyTotal,
  Settings,
} from '../types/models';

// ---------------------------------------------------------------------------
// Date helpers — sessions store local calendar dates as 'YYYY-MM-DD' strings.
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Parse a 'YYYY-MM-DD' string into a local Date at midnight. */
function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole-day difference a - b (a later than b → positive). */
function dayDiff(a: string, b: string): number {
  const ms = fromISODate(a).getTime() - fromISODate(b).getTime();
  return Math.round(ms / 86400000);
}

function addDays(s: string, days: number): string {
  const d = fromISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function listProjects(status?: ProjectStatus): Project[] {
  if (status) {
    return dbAll<Project>(
      'SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC',
      [status],
    );
  }
  return dbAll<Project>('SELECT * FROM projects ORDER BY updated_at DESC');
}

export function getProject(id: number): Project | null {
  return dbGet<Project>('SELECT * FROM projects WHERE id = ?', [id]);
}

export function createProject(input: NewProjectInput): Project {
  const result = dbRun(
    `INSERT INTO projects (title, genre, target_word_count, deadline)
     VALUES (?, ?, ?, ?)`,
    [
      input.title,
      input.genre ?? null,
      input.target_word_count,
      input.deadline ?? null,
    ],
  );
  return getProject(result.lastInsertRowid) as Project;
}

export function updateProject(id: number, input: UpdateProjectInput): Project | null {
  const fields: string[] = [];
  const params: unknown[] = [];
  const set = (col: string, val: unknown) => { fields.push(`${col} = ?`); params.push(val); };

  if (input.title !== undefined) set('title', input.title);
  if (input.genre !== undefined) set('genre', input.genre);
  if (input.target_word_count !== undefined) set('target_word_count', input.target_word_count);
  if (input.deadline !== undefined) set('deadline', input.deadline);
  if (input.status !== undefined) set('status', input.status);

  if (fields.length > 0) {
    fields.push(`updated_at = datetime('now')`);
    dbRun(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
  }
  return getProject(id);
}

export function setProjectStatus(id: number, status: ProjectStatus): Project | null {
  return updateProject(id, { status });
}

export function startNewDraft(id: number): Project | null {
  const project = getProject(id);
  if (!project) return null;
  dbRun(
    `UPDATE projects SET current_draft = current_draft + 1, updated_at = datetime('now') WHERE id = ?`,
    [id],
  );
  return getProject(id);
}

export function deleteProject(id: number): void {
  dbRun('DELETE FROM sessions WHERE project_id = ?', [id]);
  dbRun('DELETE FROM milestones WHERE project_id = ?', [id]);
  dbRun('DELETE FROM goals WHERE project_id = ?', [id]);
  dbRun('DELETE FROM projects WHERE id = ?', [id]);
}

/** Total words ever written on the project, across all drafts. */
function projectLifetimeWords(id: number): number {
  const row = dbGet<{ total: number }>(
    'SELECT COALESCE(SUM(words_written), 0) AS total FROM sessions WHERE project_id = ?',
    [id],
  );
  return row?.total ?? 0;
}

/** Words written in the project's current draft only (drives the progress bar). */
function projectDraftWords(project: Project): number {
  const row = dbGet<{ total: number }>(
    'SELECT COALESCE(SUM(words_written), 0) AS total FROM sessions WHERE project_id = ? AND draft_number = ?',
    [project.id, project.current_draft],
  );
  return row?.total ?? 0;
}

// ---------------------------------------------------------------------------
// Pace calculator
// ---------------------------------------------------------------------------

export function computeProgress(project: Project): ProjectProgress {
  const words = projectDraftWords(project);
  const target = project.target_word_count || 0;
  const percent = target > 0 ? Math.min(100, (words / target) * 100) : 0;

  // Average words/day over the active span of the current draft.
  const span = dbGet<{ first: string | null; days: number }>(
    `SELECT MIN(session_date) AS first,
            COUNT(DISTINCT session_date) AS days
     FROM sessions WHERE project_id = ? AND draft_number = ?`,
    [project.id, project.current_draft],
  );
  const today = todayISO();
  let avgPerDay = 0;
  if (span?.first) {
    const elapsed = Math.max(1, dayDiff(today, span.first) + 1);
    avgPerDay = words / elapsed;
  }

  const remaining = Math.max(0, target - words);
  let projectedFinish: string | null = null;
  if (avgPerDay > 0 && remaining > 0) {
    projectedFinish = addDays(today, Math.ceil(remaining / avgPerDay));
  } else if (remaining === 0 && target > 0) {
    projectedFinish = today; // already there
  }

  let daysUntilDeadline: number | null = null;
  let dailyNeeded: number | null = null;
  if (project.deadline) {
    daysUntilDeadline = dayDiff(project.deadline, today);
    if (daysUntilDeadline > 0) {
      dailyNeeded = Math.ceil(remaining / daysUntilDeadline);
    } else {
      dailyNeeded = remaining; // due today or overdue
    }
  }

  return {
    ...project,
    words_this_draft: words,
    percent_complete: percent,
    projected_finish: projectedFinish,
    daily_words_needed: dailyNeeded,
    avg_words_per_day: Math.round(avgPerDay),
    days_until_deadline: daysUntilDeadline,
  };
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export function computeStreak(): StreakInfo {
  const rows = dbAll<{ session_date: string }>(
    'SELECT DISTINCT session_date FROM sessions ORDER BY session_date DESC',
  );
  const dates = rows.map(r => r.session_date);
  if (dates.length === 0) return { current: 0, longest: 0 };

  const today = todayISO();
  const gapFromToday = dayDiff(today, dates[0]);

  // Current streak: must end today or yesterday (grace period — today may not
  // be logged yet, so we don't break the streak until the gap exceeds 1 day).
  let current = 0;
  if (gapFromToday <= 1) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      if (dayDiff(dates[i - 1], dates[i]) === 1) current++;
      else break;
    }
  }

  // Longest streak ever: walk the full ordered list.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dayDiff(dates[i - 1], dates[i]) === 1) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  return { current, longest };
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

const MILESTONE_THRESHOLDS = [10000, 25000, 50000, 75000, 100000];

function milestoneLabel(words: number, target: number): string {
  if (words === target) return 'Target reached!';
  if (words >= 1000) return `${Math.round(words / 1000)}k words`;
  return `${words} words`;
}

/** Detect and record any thresholds newly crossed by the project. */
function detectMilestones(project: Project): Milestone[] {
  const total = projectLifetimeWords(project.id);
  const thresholds = [...MILESTONE_THRESHOLDS];
  if (project.target_word_count > 0 && !thresholds.includes(project.target_word_count)) {
    thresholds.push(project.target_word_count);
  }
  thresholds.sort((a, b) => a - b);

  const crossed: Milestone[] = [];
  for (const threshold of thresholds) {
    if (total < threshold) continue;
    const existing = dbGet<{ id: number }>(
      'SELECT id FROM milestones WHERE project_id = ? AND words_at_milestone = ?',
      [project.id, threshold],
    );
    if (existing) continue;
    const label = milestoneLabel(threshold, project.target_word_count);
    const result = dbRun(
      `INSERT INTO milestones (project_id, label, words_at_milestone, achieved_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [project.id, label, threshold],
    );
    const m = dbGet<Milestone>('SELECT * FROM milestones WHERE id = ?', [result.lastInsertRowid]);
    if (m) crossed.push(m);
  }
  return crossed;
}

export function listMilestones(projectId: number): Milestone[] {
  return dbAll<Milestone>(
    'SELECT * FROM milestones WHERE project_id = ? ORDER BY words_at_milestone ASC',
    [projectId],
  );
}

export function addCustomMilestone(projectId: number, label: string, words: number): Milestone {
  const result = dbRun(
    `INSERT INTO milestones (project_id, label, words_at_milestone, achieved_at)
     VALUES (?, ?, ?, datetime('now'))`,
    [projectId, label, words],
  );
  return dbGet<Milestone>('SELECT * FROM milestones WHERE id = ?', [result.lastInsertRowid]) as Milestone;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function recentSessions(projectId: number, limit = 10): Session[] {
  return dbAll<Session>(
    `SELECT * FROM sessions WHERE project_id = ?
     ORDER BY session_date DESC, id DESC LIMIT ?`,
    [projectId, limit],
  );
}

export function logSession(input: NewSessionInput): SessionResult {
  const project = getProject(input.project_id);
  if (!project) throw new Error(`Project ${input.project_id} not found`);

  const result = dbRun(
    `INSERT INTO sessions
       (project_id, draft_number, words_written, duration_minutes, session_date, note, sprint_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.project_id,
      project.current_draft,
      input.words_written,
      input.duration_minutes ?? null,
      input.session_date,
      input.note ?? null,
      input.sprint_mode ? 1 : 0,
    ],
  );
  dbRun(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`, [input.project_id]);

  const session = dbGet<Session>('SELECT * FROM sessions WHERE id = ?', [result.lastInsertRowid]) as Session;
  const milestones = detectMilestones(project);

  return {
    session,
    milestones_crossed: milestones,
    streak: computeStreak(),
    project_words: projectDraftWords(project),
  };
}

export function deleteSession(id: number): void {
  dbRun('DELETE FROM sessions WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Goals / settings
// ---------------------------------------------------------------------------

export function getDailyGoal(): number {
  const row = dbGet<{ daily_target: number }>(
    'SELECT daily_target FROM goals WHERE project_id IS NULL ORDER BY id DESC LIMIT 1',
  );
  return row?.daily_target ?? 1000;
}

export function setDailyGoal(target: number): void {
  const existing = dbGet<{ id: number }>(
    'SELECT id FROM goals WHERE project_id IS NULL ORDER BY id DESC LIMIT 1',
  );
  if (existing) {
    dbRun('UPDATE goals SET daily_target = ? WHERE id = ?', [target, existing.id]);
  } else {
    dbRun('INSERT INTO goals (daily_target, project_id) VALUES (?, NULL)', [target]);
  }
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function todayWords(): number {
  const row = dbGet<{ total: number }>(
    'SELECT COALESCE(SUM(words_written), 0) AS total FROM sessions WHERE session_date = ?',
    [todayISO()],
  );
  return row?.total ?? 0;
}

function bestDayThisMonth(): number {
  const month = todayISO().slice(0, 7); // YYYY-MM
  const row = dbGet<{ best: number }>(
    `SELECT COALESCE(MAX(daily), 0) AS best FROM (
       SELECT SUM(words_written) AS daily FROM sessions
       WHERE substr(session_date, 1, 7) = ?
       GROUP BY session_date
     )`,
    [month],
  );
  return row?.best ?? 0;
}

export function getDashboard(): DashboardData {
  const goal = getDailyGoal();
  const today = todayWords();
  const active = listProjects('active').map(computeProgress);
  return {
    today_words: today,
    daily_goal: goal,
    goal_percent: goal > 0 ? Math.min(100, (today / goal) * 100) : 0,
    streak: computeStreak(),
    best_day_this_month: bestDayThisMonth(),
    active_projects: active,
    nano_mode: getNanoMode(),
  };
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/** Map of session_date → total words, for any range. */
function dailyTotalsMap(): Map<string, number> {
  const rows = dbAll<{ session_date: string; total: number }>(
    'SELECT session_date, SUM(words_written) AS total FROM sessions GROUP BY session_date',
  );
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.session_date, r.total);
  return map;
}

function zeroFilledRange(days: number, totals: Map<string, number>): DayCount[] {
  const out: DayCount[] = [];
  const today = todayISO();
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    out.push({ date, words: totals.get(date) ?? 0 });
  }
  return out;
}

export function getAnalytics(): AnalyticsData {
  const totals = dailyTotalsMap();

  // Weekday totals (0 = Sunday … 6 = Saturday).
  const weekday = [0, 0, 0, 0, 0, 0, 0];
  for (const [date, words] of totals) {
    weekday[fromISODate(date).getDay()] += words;
  }

  // Monthly aggregation.
  const monthlyRows = dbAll<{
    month: string; total: number; sessions: number;
  }>(
    `SELECT substr(session_date, 1, 7) AS month,
            SUM(words_written) AS total,
            COUNT(*) AS sessions
     FROM sessions GROUP BY month ORDER BY month DESC`,
  );
  const monthly: MonthlyTotal[] = monthlyRows.map(m => {
    const bestRow = dbGet<{ best: number }>(
      `SELECT COALESCE(MAX(daily), 0) AS best FROM (
         SELECT SUM(words_written) AS daily FROM sessions
         WHERE substr(session_date, 1, 7) = ? GROUP BY session_date
       )`,
      [m.month],
    );
    return {
      month: m.month,
      total_words: m.total,
      sessions: m.sessions,
      avg_words_per_session: m.sessions > 0 ? Math.round(m.total / m.sessions) : 0,
      best_day: bestRow?.best ?? 0,
    };
  });

  const wph = dbGet<{ words: number; minutes: number }>(
    `SELECT COALESCE(SUM(words_written), 0) AS words,
            COALESCE(SUM(duration_minutes), 0) AS minutes
     FROM sessions WHERE duration_minutes IS NOT NULL AND duration_minutes > 0`,
  );
  const wordsPerHour = wph && wph.minutes > 0
    ? Math.round((wph.words / wph.minutes) * 60)
    : null;

  const allTime = dbGet<{ words: number; sessions: number }>(
    'SELECT COALESCE(SUM(words_written), 0) AS words, COUNT(*) AS sessions FROM sessions',
  );

  return {
    words_per_day: zeroFilledRange(30, totals),
    weekday_totals: weekday,
    contribution: zeroFilledRange(365, totals),
    monthly,
    words_per_hour: wordsPerHour,
    all_time_words: allTime?.words ?? 0,
    all_time_sessions: allTime?.sessions ?? 0,
    streak: computeStreak(),
  };
}

// ---------------------------------------------------------------------------
// CSV / JSON export
// ---------------------------------------------------------------------------

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportSessionsCSV(): string {
  const rows = dbAll<Session & { project_title: string }>(
    `SELECT s.*, p.title AS project_title
     FROM sessions s JOIN projects p ON p.id = s.project_id
     ORDER BY s.session_date ASC, s.id ASC`,
  );
  const header = [
    'session_date', 'project_title', 'draft_number', 'words_written',
    'duration_minutes', 'sprint_mode', 'note',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.session_date, r.project_title, r.draft_number, r.words_written,
      r.duration_minutes, r.sprint_mode, r.note,
    ].map(csvEscape).join(','));
  }
  return lines.join('\n');
}

export function exportFullJSON(): string {
  return JSON.stringify({
    exported_at: new Date().toISOString(),
    projects: dbAll('SELECT * FROM projects ORDER BY id'),
    sessions: dbAll('SELECT * FROM sessions ORDER BY id'),
    goals: dbAll('SELECT * FROM goals ORDER BY id'),
    milestones: dbAll('SELECT * FROM milestones ORDER BY id'),
  }, null, 2);
}

// ---------------------------------------------------------------------------
// Settings bundle (used by the Settings screen)
// ---------------------------------------------------------------------------

export function getSettings(dbPath: string, version: string): Settings {
  return {
    daily_goal: getDailyGoal(),
    db_path: dbPath,
    nano_mode: getNanoMode(),
    version,
  };
}
