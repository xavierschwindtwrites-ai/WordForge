import React, { useState } from 'react';
import type { Project } from '../../types/models';

interface NewProjectModalProps {
  onCreated: (project: Project) => void;
  onClose: () => void;
}

const GENRES = [
  'Fantasy', 'Science Fiction', 'Literary Fiction', 'Romance', 'Mystery',
  'Thriller', 'Horror', 'Historical', 'Young Adult', 'Non-fiction', 'Memoir', 'Other',
];

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onCreated, onClose }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [target, setTarget] = useState(80000);
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const project = await window.wordforge.createProject({
      title: title.trim(),
      genre: genre || null,
      target_word_count: target || 0,
      deadline: deadline || null,
    });
    onCreated(project);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">New project</h2>

        <label className="field">
          <span className="field-label">Title</span>
          <input
            className="field-input"
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="Untitled Manuscript"
          />
        </label>

        <label className="field">
          <span className="field-label">Genre</span>
          <select className="field-input" value={genre} onChange={e => setGenre(e.target.value)}>
            <option value="">Select a genre…</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Target word count</span>
            <input
              className="field-input"
              type="number"
              min={0}
              step={1000}
              value={target}
              onChange={e => setTarget(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span className="field-label">Deadline (optional)</span>
            <input
              className="field-input"
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={submit} disabled={!title.trim() || saving}>
            Create project
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
