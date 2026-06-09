import React, { useEffect, useState } from 'react';
import type { Settings as SettingsData } from '../../types/models';

interface SettingsProps {
  onChanged: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onChanged }) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [goal, setGoal] = useState(1000);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => window.wordforge.getSettings().then(s => { setSettings(s); setGoal(s.daily_goal); });
  useEffect(() => { load(); }, []);

  if (!settings) return <div className="screen-loading">Loading…</div>;

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const saveGoal = async () => {
    await window.wordforge.setDailyGoal(goal);
    onChanged();
    flash('Daily goal saved.');
  };

  const toggleNano = async () => {
    const next = !settings.nano_mode;
    await window.wordforge.setNanoMode(next);
    setSettings({ ...settings, nano_mode: next });
    onChanged();
  };

  const move = async () => {
    const newPath = await window.wordforge.moveDatabase();
    if (newPath) { await load(); flash('Database moved.'); }
  };

  const exportCSV = async () => { const p = await window.wordforge.exportCSV(); if (p) flash('CSV exported.'); };
  const exportJSON = async () => { const p = await window.wordforge.exportJSON(); if (p) flash('JSON exported.'); };
  const exportSQLite = async () => { const p = await window.wordforge.exportSQLite(); if (p) flash('Database exported.'); };

  return (
    <div className="screen settings">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Make it yours</p>
          <h1 className="screen-title">Settings</h1>
        </div>
      </header>

      <section className="card">
        <h2 className="card-title">Daily goal</h2>
        <p className="muted">Your default target words per day, shown on the dashboard.</p>
        <div className="inline-field">
          <input
            className="field-input"
            type="number"
            min={0}
            step={100}
            value={goal}
            onChange={e => setGoal(Number(e.target.value))}
          />
          <button className="primary-btn" onClick={saveGoal}>Save</button>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">NaNoWriMo mode</h2>
        <p className="muted">
          Show a National Novel Writing Month overlay on your dashboard — a 50,000 word target and a
          countdown to November 30th.
        </p>
        <label className="toggle-row" onClick={toggleNano}>
          <span className={`toggle${settings.nano_mode ? ' on' : ''}`}><span className="toggle-knob" /></span>
          <span>{settings.nano_mode ? 'Enabled' : 'Disabled'}</span>
        </label>
      </section>

      <section className="card">
        <h2 className="card-title">Database location</h2>
        <p className="muted">Your data lives in a single local SQLite file. Nothing leaves your machine.</p>
        <code className="db-path">{settings.db_path}</code>
        <button className="ghost-btn" onClick={move}>Move database…</button>
      </section>

      <section className="card">
        <h2 className="card-title">Sync (the honest version)</h2>
        <p className="muted">
          WordForge has no cloud and no accounts — by design. If you want your data on more than one
          computer, use <strong>Move database…</strong> above to place the <code>wordforge.db</code> file
          inside your iCloud Drive, Dropbox, or other sync folder. WordForge will read and write there
          directly. There’s no magic: it’s just a file in a folder your sync service watches. Avoid editing
          on two machines at the same time, since the last save wins.
        </p>
      </section>

      <section className="card">
        <h2 className="card-title">Export your data</h2>
        <p className="muted">It’s your writing. Take it anywhere, anytime.</p>
        <div className="button-row">
          <button className="ghost-btn" onClick={exportCSV}>Export sessions (CSV)</button>
          <button className="ghost-btn" onClick={exportJSON}>Export everything (JSON)</button>
          <button className="ghost-btn" onClick={exportSQLite}>Export database (.db)</button>
        </div>
      </section>

      <section className="card about-card">
        <h2 className="card-title">About</h2>
        <p className="muted">WordForge v{settings.version} · MIT License</p>
        <p className="muted">A privacy-first word count tracker for fiction authors.</p>
        <a
          className="link-btn"
          href="https://github.com/xavierschwindtwrites-ai"
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub →
        </a>
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Settings;
