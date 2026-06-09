# WordForge

A beautiful, privacy-first desktop word count tracker and productivity tool for
fiction authors. WordForge is 100% local — no backend, no cloud, no accounts.
Your manuscript data lives in a single SQLite file on your own machine.

Built with **Electron + React + TypeScript + sql.js**, distributed as an
unsigned `.dmg` (macOS) and `.exe` (Windows) via GitHub Actions — no Apple
Developer account required.

## Features

- **Dashboard** — today's words, daily goal ring, writing streak, active
  projects with live pace projections, best day this month.
- **Projects** — card library (active / completed / archived), per-project
  progress, drafts, deadlines, genre tags.
- **Project detail** — progress ring, pace calculator ("at your current pace
  you'll finish on…"), daily-words-needed for deadlines, recent sessions, and
  auto-detected milestones (10k / 25k / 50k / 75k / 100k / target).
- **Log Session** — log words from anywhere, backfill dates, optional duration
  and notes, with an embedded Sprint timer.
- **Analytics** — words-per-day bar chart, words-per-hour, best-weekday heatmap,
  a full-year GitHub-style contribution grid, monthly totals, and all-time stats.
- **Sprint mode** — 15/25/45/60-minute focus timer with a chime on completion.
- **Settings** — daily goal, NaNoWriMo overlay, move your database into a
  Dropbox/iCloud folder, and export to CSV / JSON / raw SQLite.

## Development

```bash
npm install
npm start        # launch the app in dev mode
npm run package  # build an unpacked app (sanity check)
npm run make     # build distributable installers
npm run lint
```

Requires Node 18+.

## Architecture

- `src/main/` — Electron main process and `preload.ts` (contextBridge IPC).
- `src/db/` — `database.ts` (sql.js loader + persistence) and `queries.ts`
  (all domain logic: streaks, milestones, pace, analytics).
- `src/renderer/` — React UI (screens under `components/`, theme in
  `styles/global.css`).
- `src/types/` — shared models and the typed `window.wordforge` API.

sql.js is loaded from its self-contained `sql-asm.js` bundle via a runtime
require (bypassing webpack) and copied into the packaged app as an
`extraResource`. The database is persisted to disk on every write.

## Privacy & sync

WordForge never talks to the network. To sync across machines, use
**Settings → Move database…** to place `wordforge.db` inside an iCloud Drive,
Dropbox, or other sync folder — it's just a file in a folder. Don't edit on two
machines at once; the last save wins.

## License

MIT
