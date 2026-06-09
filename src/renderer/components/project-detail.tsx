import React, { useCallback, useEffect, useState } from 'react';
import type { ProjectProgress, Session, Milestone } from '../../types/models';
import { ProgressRing } from './progress';
import { formatNumber, formatDate, formatDateShort, pluralize } from '../lib/format';

interface ProjectDetailProps {
  projectId: number;
  onBack: () => void;
  onLogSession: (projectId: number) => void;
  onChanged: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, onLogSession, onChanged }) => {
  const [project, setProject] = useState<ProjectProgress | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    const [p, s, m] = await Promise.all([
      window.wordforge.getProgress(projectId),
      window.wordforge.recentSessions(projectId, 10),
      window.wordforge.listMilestones(projectId),
    ]);
    setProject(p);
    setSessions(s);
    setMilestones(m);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (!project) return <div className="screen-loading">Loading…</div>;

  const newDraft = async () => {
    if (!confirm(`Start draft ${project.current_draft + 1}? Your progress bar resets; all session history is preserved.`)) return;
    await window.wordforge.startNewDraft(projectId);
    await load();
    onChanged();
  };

  const changeStatus = async (status: 'active' | 'completed' | 'archived') => {
    setMenuOpen(false);
    await window.wordforge.setProjectStatus(projectId, status);
    await load();
    onChanged();
  };

  const remaining = Math.max(0, project.target_word_count - project.words_this_draft);

  return (
    <div className="screen detail">
      <button className="back-btn" onClick={onBack}>← Projects</button>

      <header className="detail-header">
        <div className="detail-title-block">
          <h1 className="screen-title">{project.title}</h1>
          <div className="detail-tags">
            {project.genre && <span className="genre-tag">{project.genre}</span>}
            <span className="draft-badge">Draft {project.current_draft}</span>
            <span className={`status-pill status-${project.status}`}>{project.status}</span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="primary-btn" onClick={() => onLogSession(projectId)}>+ Log Session</button>
          <div className="menu-wrap">
            <button className="ghost-btn icon-only" onClick={() => setMenuOpen(o => !o)}>⋯</button>
            {menuOpen && (
              <div className="dropdown" onMouseLeave={() => setMenuOpen(false)}>
                <button className="dropdown-item" onClick={newDraft}>Start new draft</button>
                {project.status !== 'completed' && (
                  <button className="dropdown-item" onClick={() => changeStatus('completed')}>Mark completed</button>
                )}
                {project.status !== 'active' && (
                  <button className="dropdown-item" onClick={() => changeStatus('active')}>Mark active</button>
                )}
                {project.status !== 'archived' && (
                  <button className="dropdown-item" onClick={() => changeStatus('archived')}>Archive</button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="detail-grid">
        <section className="detail-ring-card">
          <ProgressRing percent={project.percent_complete} size={220} stroke={16}>
            <span className="ring-number">{Math.round(project.percent_complete)}%</span>
            <span className="ring-sub">{formatNumber(project.words_this_draft)} / {formatNumber(project.target_word_count)}</span>
          </ProgressRing>
          <p className="ring-caption">{pluralize(remaining, 'word')} to go</p>
        </section>

        <section className="pace-card">
          <h2 className="card-title">Pace</h2>
          <div className="pace-rows">
            <PaceRow
              label="At your current pace, you’ll finish"
              value={project.projected_finish ? formatDate(project.projected_finish) : 'Log a session to project'}
            />
            <PaceRow
              label="Average so far"
              value={project.avg_words_per_day > 0 ? `${formatNumber(project.avg_words_per_day)} words/day` : '—'}
            />
            {project.deadline && (
              <>
                <PaceRow label="Deadline" value={formatDate(project.deadline)} />
                <PaceRow
                  label="Days remaining"
                  value={project.days_until_deadline != null && project.days_until_deadline >= 0
                    ? pluralize(project.days_until_deadline, 'day')
                    : 'Past deadline'}
                />
                <PaceRow
                  label="To hit your deadline, write"
                  value={project.daily_words_needed != null
                    ? `${formatNumber(project.daily_words_needed)} words/day`
                    : '—'}
                  highlight
                />
              </>
            )}
          </div>
        </section>
      </div>

      <div className="detail-grid">
        <section className="sessions-card">
          <h2 className="card-title">Recent sessions</h2>
          {sessions.length === 0 ? (
            <p className="muted">No sessions logged yet.</p>
          ) : (
            <ul className="session-list">
              {sessions.map(s => (
                <li key={s.id} className="session-item">
                  <div className="session-date">{formatDateShort(s.session_date)}</div>
                  <div className="session-main">
                    <span className="session-words">+{formatNumber(s.words_written)} words</span>
                    {s.note && <span className="session-note">{s.note}</span>}
                  </div>
                  <div className="session-meta">
                    {s.sprint_mode === 1 && <span className="sprint-chip">sprint</span>}
                    {s.duration_minutes ? <span>{s.duration_minutes}m</span> : null}
                    <span className="session-draft">D{s.draft_number}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="milestones-card">
          <h2 className="card-title">Milestones</h2>
          <ul className="milestone-list">
            {[10000, 25000, 50000, 75000, 100000, project.target_word_count]
              .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
              .sort((a, b) => a - b)
              .map(threshold => {
                const hit = milestones.find(m => m.words_at_milestone === threshold);
                return (
                  <li key={threshold} className={`milestone-item${hit ? ' achieved' : ''}`}>
                    <span className="milestone-dot" />
                    <span className="milestone-label">
                      {threshold === project.target_word_count ? 'Target' : `${formatNumber(threshold)} words`}
                    </span>
                    <span className="milestone-status">
                      {hit ? `✓ ${formatDate(hit.achieved_at)}` : formatNumber(threshold)}
                    </span>
                  </li>
                );
              })}
            {milestones
              .filter(m => ![10000, 25000, 50000, 75000, 100000, project.target_word_count].includes(m.words_at_milestone))
              .map(m => (
                <li key={m.id} className="milestone-item achieved">
                  <span className="milestone-dot" />
                  <span className="milestone-label">{m.label}</span>
                  <span className="milestone-status">✓ {formatDate(m.achieved_at)}</span>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

const PaceRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`pace-row${highlight ? ' pace-row--highlight' : ''}`}>
    <span className="pace-label">{label}</span>
    <span className="pace-value">{value}</span>
  </div>
);

export default ProjectDetail;
