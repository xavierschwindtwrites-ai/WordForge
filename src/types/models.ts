// Shared domain models used by both the main process (db layer) and the
// renderer (React components). Kept dependency-free so it can be imported
// from anywhere.

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: number;
  title: string;
  genre: string | null;
  target_word_count: number;
  deadline: string | null; // ISO date YYYY-MM-DD or null
  status: ProjectStatus;
  current_draft: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  project_id: number;
  draft_number: number;
  words_written: number;
  duration_minutes: number | null;
  session_date: string; // ISO date YYYY-MM-DD
  note: string | null;
  sprint_mode: number; // 0 | 1
  created_at: string;
}

export interface Milestone {
  id: number;
  project_id: number;
  label: string;
  words_at_milestone: number;
  achieved_at: string;
}

// ---- Input payloads ----

export interface NewProjectInput {
  title: string;
  genre?: string | null;
  target_word_count: number;
  deadline?: string | null;
}

export interface UpdateProjectInput {
  title?: string;
  genre?: string | null;
  target_word_count?: number;
  deadline?: string | null;
  status?: ProjectStatus;
}

export interface NewSessionInput {
  project_id: number;
  words_written: number;
  duration_minutes?: number | null;
  session_date: string;
  note?: string | null;
  sprint_mode?: boolean;
}

// ---- Derived / computed shapes ----

/** A project enriched with progress numbers for the current draft. */
export interface ProjectProgress extends Project {
  words_this_draft: number;
  percent_complete: number; // 0–100, clamped
  /** Projected finish date (ISO) at current pace, or null if unknown. */
  projected_finish: string | null;
  /** Words/day needed to hit the deadline, or null if no deadline. */
  daily_words_needed: number | null;
  /** Average words/day since the first session of this draft. */
  avg_words_per_day: number;
  days_until_deadline: number | null;
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export interface DashboardData {
  today_words: number;
  daily_goal: number;
  goal_percent: number; // 0–100, clamped
  streak: StreakInfo;
  best_day_this_month: number;
  active_projects: ProjectProgress[];
  nano_mode: boolean;
}

export interface SessionResult {
  session: Session;
  /** Milestones newly crossed by this session (for the celebration modal). */
  milestones_crossed: Milestone[];
  streak: StreakInfo;
  project_words: number;
}

export interface DayCount {
  date: string; // YYYY-MM-DD
  words: number;
}

export interface MonthlyTotal {
  month: string; // YYYY-MM
  total_words: number;
  sessions: number;
  avg_words_per_session: number;
  best_day: number;
}

export interface AnalyticsData {
  /** Last 30 calendar days, oldest → newest, zero-filled. */
  words_per_day: DayCount[];
  /** Index 0 = Sunday … 6 = Saturday. Total words written on that weekday. */
  weekday_totals: number[];
  /** One full year of days (oldest → newest), zero-filled, for the grid. */
  contribution: DayCount[];
  monthly: MonthlyTotal[];
  words_per_hour: number | null;
  all_time_words: number;
  all_time_sessions: number;
  streak: StreakInfo;
}

export interface Settings {
  daily_goal: number;
  db_path: string;
  nano_mode: boolean;
  version: string;
}
