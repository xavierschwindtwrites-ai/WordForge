import React, { useEffect, useState } from 'react';
import type { AnalyticsData } from '../../types/models';
import ContributionGrid from './contribution-grid';
import Counter from './counter';
import { formatNumber, formatMonth, formatDateShort } from '../lib/format';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => { window.inkwell.getAnalytics().then(setData); }, []);

  if (!data) return <div className="screen-loading">Loading…</div>;

  const maxDay = Math.max(1, ...data.words_per_day.map(d => d.words));
  const maxWeekday = Math.max(1, ...data.weekday_totals);

  return (
    <div className="screen analytics">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">The long view</p>
          <h1 className="screen-title">Analytics</h1>
        </div>
      </header>

      <section className="alltime-row">
        <AllTimeStat label="Words all-time" value={data.all_time_words} />
        <AllTimeStat label="Sessions" value={data.all_time_sessions} />
        <AllTimeStat label="Longest streak" value={data.streak.longest} unit="days" />
        <AllTimeStat label="Current streak" value={data.streak.current} unit="days" accent />
        <AllTimeStat
          label="Words / hour"
          value={data.words_per_hour ?? 0}
          placeholder={data.words_per_hour == null ? 'Log durations' : undefined}
        />
      </section>

      <section className="card">
        <h2 className="card-title">Words per day · last 30 days</h2>
        <div className="bar-chart">
          {data.words_per_day.map(d => (
            <div key={d.date} className="bar-col" title={`${formatDateShort(d.date)}: ${formatNumber(d.words)} words`}>
              <div className="bar" style={{ height: `${(d.words / maxDay) * 100}%` }} />
            </div>
          ))}
        </div>
      </section>

      <div className="analytics-grid">
        <section className="card">
          <h2 className="card-title">Best writing days</h2>
          <div className="heatmap">
            {WEEKDAYS.map((day, i) => (
              <div key={day} className="heat-row">
                <span className="heat-label">{day}</span>
                <div className="heat-bar-track">
                  <div className="heat-bar" style={{ width: `${(data.weekday_totals[i] / maxWeekday) * 100}%` }} />
                </div>
                <span className="heat-value">{formatNumber(data.weekday_totals[i])}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="card-title">Monthly totals</h2>
          {data.monthly.length === 0 ? (
            <p className="muted">No sessions yet.</p>
          ) : (
            <table className="monthly-table">
              <thead>
                <tr><th>Month</th><th>Words</th><th>Sessions</th><th>Avg</th><th>Best day</th></tr>
              </thead>
              <tbody>
                {data.monthly.map(m => (
                  <tr key={m.month}>
                    <td>{formatMonth(m.month)}</td>
                    <td>{formatNumber(m.total_words)}</td>
                    <td>{m.sessions}</td>
                    <td>{formatNumber(m.avg_words_per_session)}</td>
                    <td>{formatNumber(m.best_day)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="card">
        <h2 className="card-title">A year of writing</h2>
        <ContributionGrid days={data.contribution} />
      </section>
    </div>
  );
};

const AllTimeStat: React.FC<{
  label: string; value: number; unit?: string; accent?: boolean; placeholder?: string;
}> = ({ label, value, unit, accent, placeholder }) => (
  <div className={`alltime-stat${accent ? ' alltime-stat--accent' : ''}`}>
    <span className="alltime-value">
      {placeholder ? <span className="alltime-placeholder">{placeholder}</span> : <Counter value={value} />}
      {!placeholder && unit && <span className="alltime-unit"> {unit}</span>}
    </span>
    <span className="alltime-label">{label}</span>
  </div>
);

export default Analytics;
