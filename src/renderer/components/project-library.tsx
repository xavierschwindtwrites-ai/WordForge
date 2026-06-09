import React, { useCallback, useEffect, useState } from 'react';
import type { ProjectProgress, ProjectStatus } from '../../types/models';
import { ProgressBar } from './progress';
import NewProjectModal from './new-project-modal';
import { formatNumber, formatDate, pluralize } from '../lib/format';

interface ProjectLibraryProps {
  onOpenProject: (id: number) => void;
  onChanged: () => void;
}

const TABS: ProjectStatus[] = ['active', 'completed', 'archived'];

const ProjectLibrary: React.FC<ProjectLibraryProps> = ({ onOpenProject, onChanged }) => {
  const [tab, setTab] = useState<ProjectStatus>('active');
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async (status: ProjectStatus) => {
    const list = await window.wordforge.listProjects(status);
    const withProgress = await Promise.all(
      list.map(p => window.wordforge.getProgress(p.id)),
    );
    setProjects(withProgress.filter((p): p is ProjectProgress => p !== null));
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  return (
    <div className="screen library">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Your shelf</p>
          <h1 className="screen-title">Projects</h1>
        </div>
        <button className="primary-btn" onClick={() => setShowNew(true)}>+ New Project</button>
      </header>

      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="empty-card">
          <p>No {tab} projects.</p>
          {tab === 'active' && (
            <button className="primary-btn" onClick={() => setShowNew(true)}>Start a new project</button>
          )}
        </div>
      ) : (
        <div className="card-grid">
          {projects.map(p => (
            <button key={p.id} className="project-card" onClick={() => onOpenProject(p.id)}>
              <div className="project-card-head">
                <h3 className="project-card-title">{p.title}</h3>
                <span className="draft-badge">Draft {p.current_draft}</span>
              </div>
              {p.genre && <span className="genre-tag">{p.genre}</span>}
              <div className="project-card-body">
                <ProgressBar percent={p.percent_complete} />
                <div className="project-card-stat">
                  <span>{formatNumber(p.words_this_draft)} / {formatNumber(p.target_word_count)}</span>
                  <span>{Math.round(p.percent_complete)}%</span>
                </div>
              </div>
              <div className="project-card-foot">
                {p.deadline ? (
                  <span>
                    {p.days_until_deadline != null && p.days_until_deadline >= 0
                      ? `${pluralize(p.days_until_deadline, 'day')} left`
                      : 'Past deadline'}
                    {' · '}{formatDate(p.deadline)}
                  </span>
                ) : (
                  <span>No deadline</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={(project) => {
            setShowNew(false);
            onChanged();
            onOpenProject(project.id);
          }}
        />
      )}
    </div>
  );
};

export default ProjectLibrary;
