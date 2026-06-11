import React, { useEffect, useMemo, useState } from 'react';
import type { Project, SessionResult } from '../../types/models';
import SprintTimer from './sprint-timer';
import { todayISO } from '../lib/format';

interface LogSessionModalProps {
  initialProjectId?: number;
  onLogged: (result: SessionResult) => void;
  onClose: () => void;
}

const LogSessionModal: React.FC<LogSessionModalProps> = ({ initialProjectId, onLogged, onClose }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(initialProjectId ?? null);
  const [words, setWords] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [sprint, setSprint] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.inkwell.listProjects('active').then(list => {
      // Fall back to any project if there are no active ones.
      if (list.length === 0) {
        window.inkwell.listProjects().then(all => {
          setProjects(all);
          if (projectId == null && all.length > 0) setProjectId(all[0].id);
        });
      } else {
        setProjects(list);
        if (projectId == null) setProjectId(list[0].id); // most recently active (ordered by updated_at)
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSave = useMemo(
    () => projectId != null && typeof words === 'number' && words > 0 && !saving,
    [projectId, words, saving],
  );

  const submit = async () => {
    if (!canSave || projectId == null) return;
    setSaving(true);
    const result = await window.inkwell.logSession({
      project_id: projectId,
      words_written: Number(words),
      duration_minutes: duration === '' ? null : Number(duration),
      session_date: date,
      note: note.trim() || null,
      sprint_mode: sprint,
    });
    onLogged(result);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Log a writing session</h2>

        {projects.length === 0 ? (
          <p className="muted">Create a project first, then log your words against it.</p>
        ) : (
          <>
            <label className="field">
              <span className="field-label">Project</span>
              <select
                className="field-input"
                value={projectId ?? ''}
                onChange={e => setProjectId(Number(e.target.value))}
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Words written</span>
              <input
                className="field-input field-input--xl"
                type="number"
                min={1}
                autoFocus
                value={words}
                placeholder="0"
                onChange={e => setWords(e.target.value === '' ? '' : Number(e.target.value))}
                onKeyDown={e => { if (e.key === 'Enter' && !sprint) submit(); }}
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Duration (min, optional)</span>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  value={duration}
                  placeholder="—"
                  onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="field-label">Date</span>
                <input
                  className="field-input"
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={e => setDate(e.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Note (optional)</span>
              <input
                className="field-input"
                value={note}
                placeholder="Finished the chapter where everything goes wrong…"
                onChange={e => setNote(e.target.value)}
              />
            </label>

            <label className="toggle-row" onClick={() => setSprint(s => !s)}>
              <span className={`toggle${sprint ? ' on' : ''}`}><span className="toggle-knob" /></span>
              <span>Sprint mode</span>
            </label>

            {sprint && (
              <div className="sprint-embed">
                <SprintTimer compact />
              </div>
            )}

            <div className="modal-actions">
              <button className="ghost-btn" onClick={onClose}>Cancel</button>
              <button className="primary-btn" onClick={submit} disabled={!canSave}>
                Save session
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogSessionModal;
