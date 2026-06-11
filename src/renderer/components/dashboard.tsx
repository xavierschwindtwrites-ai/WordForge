import React, { useEffect, useState } from 'react';
import type { DashboardData } from '../../types/models';
import type { Screen } from '../app';
import Counter from './counter';
import { ProgressBar, ProgressRing } from './progress';
import { formatNumber, formatDate, pluralize } from '../lib/format';

interface DashboardProps {
  onLogSession: (projectId?: number) => void;
  onOpenProject: (id: number) => void;
  onNavigate: (s: Screen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogSession, onOpenProject, onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    window.inkwell.getDashboard().then(setData);
  }, []);

  if (!data) return <div className="screen-loading">Loading…</div>;

  const greeting = getGreeting();

  return (
    <div className="screen dashboard">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">{greeting}</p>
          <h1 className="screen-title">Today at the desk</h1>
        </div>
        <button className="primary-btn" onClick={() => onLogSession()}>+ Log Session</button>
      </header>

      {data.nano_mode && <NanoBanner data={data} />}

      <section className="dash-hero">
        <div className="dash-goal-card">
          <ProgressRing percent={data.goal_percent} size={188} stroke={13}>
            <Counter value={data.today_words} className="ring-number" />
            <span className="ring-sub">of {formatNumber(data.daily_goal)} words</span>
          </ProgressRing>
          <div className="dash-goal-meta">
            <span className="dash-goal-percent">
              <Counter value={Math.round(data.goal_percent)} suffix="%" />
            </span>
            <span className="dash-goal-label">
              {data.goal_percent >= 100 ? 'Goal met — beautiful work.' : 'of today’s goal'}
            </span>
          </div>
        </div>

        <div className="dash-stats">
          <StatCard
            label="Current streak"
            value={<Counter value={data.streak.current} />}
            unit={data.streak.current === 1 ? 'day' : 'days'}
            accent
            icon="🔥"
          />
          <StatCard
            label="Longest streak"
            value={<Counter value={data.streak.longest} />}
            unit={data.streak.longest === 1 ? 'day' : 'days'}
          />
          <StatCard
            label="Best day this month"
            value={<Counter value={data.best_day_this_month} />}
            unit="words"
          />
        </div>
      </section>

      <section className="dash-projects">
        <div className="section-head">
          <h2 className="section-title">Active projects</h2>
          <button className="link-btn" onClick={() => onNavigate('Library')}>View all →</button>
        </div>

        {data.active_projects.length === 0 ? (
          <div className="empty-card">
            <p>No active projects yet.</p>
            <button className="primary-btn" onClick={() => onNavigate('Library')}>Create your first project</button>
          </div>
        ) : (
          <div className="project-rows">
            {data.active_projects.map(p => (
              <button key={p.id} className="project-row" onClick={() => onOpenProject(p.id)}>
                <div className="project-row-top">
                  <span className="project-row-title">{p.title}</span>
                  <span className="project-row-words">
                    {formatNumber(p.words_this_draft)} / {formatNumber(p.target_word_count)}
                  </span>
                </div>
                <ProgressBar percent={p.percent_complete} />
                <div className="project-row-meta">
                  <span>{Math.round(p.percent_complete)}% complete</span>
                  <span>
                    {p.projected_finish
                      ? `Finish ~${formatDate(p.projected_finish)}`
                      : 'Log a session to project your pace'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  unit: string;
  accent?: boolean;
  icon?: string;
}> = ({ label, value, unit, accent, icon }) => (
  <div className={`stat-card${accent ? ' stat-card--accent' : ''}`}>
    <span className="stat-label">{icon && <span className="stat-icon">{icon}</span>}{label}</span>
    <span className="stat-value">{value}<span className="stat-unit">{unit}</span></span>
  </div>
);

const NanoBanner: React.FC<{ data: DashboardData }> = ({ data }) => {
  const year = new Date().getFullYear();
  const target = 50000;
  const nov30 = new Date(year, 10, 30);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((nov30.getTime() - today.getTime()) / 86400000));
  return (
    <div className="nano-banner">
      <div className="nano-banner-head">
        <span className="nano-badge">NaNoWriMo</span>
        <span>{pluralize(daysLeft, 'day')} until Nov 30 · 50,000 word target</span>
      </div>
      <ProgressBar percent={Math.min(100, (data.today_words / target) * 100)} className="nano-progress" />
    </div>
  );
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning, writer';
  if (h < 17) return 'Good afternoon, writer';
  return 'Good evening, writer';
}

export default Dashboard;
