/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { getDbPath, defaultDbPath, setDbPath } from './config';

// Use __non_webpack_require__ to bypass webpack's module wrapping entirely.
// sql.js's asm.js build assigns to module.exports which breaks inside
// webpack's scope. This does a real Node.js require at runtime.
// In dev: resolves from project node_modules.
// In packaged app: resolves from extraResource copied into Resources/.
declare const __non_webpack_require__: typeof require;

function loadSqlJs(): (config?: Record<string, unknown>) => Promise<{ Database: new (data?: ArrayLike<number> | Buffer | null) => SqlJsDatabase }> {
  // In packaged app, the file is in Resources/sql-asm.js (via extraResource)
  const resourcePath = path.join(
    path.dirname(app.getAppPath()),
    'sql-asm.js',
  );
  if (fs.existsSync(resourcePath)) {
    return __non_webpack_require__(resourcePath);
  }
  // Dev mode: resolve from node_modules
  return __non_webpack_require__('sql.js/dist/sql-asm.js');
}

interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  prepare(sql: string): SqlJsStatement;
  export(): Uint8Array;
  close(): void;
}

interface SqlJsStatement {
  bind(params?: unknown[]): boolean;
  step(): boolean;
  getColumnNames(): string[];
  get(): unknown[];
  free(): boolean;
}

let db: SqlJsDatabase | null = null;

function activeDbPath(): string {
  return getDbPath();
}

function persist(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(activeDbPath(), Buffer.from(data));
}

function applySchema(d: SqlJsDatabase): void {
  d.run('PRAGMA foreign_keys = ON');
  d.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      genre TEXT,
      target_word_count INTEGER DEFAULT 80000,
      deadline TEXT,
      status TEXT DEFAULT 'active',
      current_draft INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  d.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      draft_number INTEGER DEFAULT 1,
      words_written INTEGER NOT NULL,
      duration_minutes INTEGER,
      session_date TEXT NOT NULL,
      note TEXT,
      sprint_mode INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  d.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_target INTEGER DEFAULT 1000,
      active_from TEXT DEFAULT (date('now')),
      project_id INTEGER
    )
  `);
  d.run(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      label TEXT NOT NULL,
      words_at_milestone INTEGER NOT NULL,
      achieved_at TEXT NOT NULL
    )
  `);
  // Seed a default global goal if none exists.
  const existing = d.exec('SELECT COUNT(*) AS n FROM goals WHERE project_id IS NULL');
  const n = existing.length > 0 ? (existing[0].values[0][0] as number) : 0;
  if (n === 0) {
    d.run('INSERT INTO goals (daily_target, project_id) VALUES (1000, NULL)');
  }
}

export async function initDatabase(): Promise<void> {
  const initFn = loadSqlJs();
  const SQL = await initFn();
  const p = activeDbPath();

  if (fs.existsSync(p)) {
    const fileBuffer = fs.readFileSync(p);
    db = new SQL.Database(fileBuffer) as SqlJsDatabase;
  } else {
    db = new SQL.Database() as SqlJsDatabase;
  }

  applySchema(db);
  persist();
}

function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized — call initDatabase() first');
  return db;
}

/** Run a statement and persist. Returns lastInsertRowid for INSERTs. */
export function dbRun(sql: string, params?: unknown[]): { lastInsertRowid: number } {
  const d = getDb();
  d.run(sql, params);
  persist();
  const row = d.exec('SELECT last_insert_rowid() AS id');
  const lastId = row.length > 0 ? (row[0].values[0][0] as number) : 0;
  return { lastInsertRowid: lastId };
}

/** Get a single row. */
export function dbGet<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | null {
  const d = getDb();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const row: Record<string, unknown> = {};
    cols.forEach((c: string, i: number) => { row[c] = vals[i]; });
    stmt.free();
    return row as T;
  }
  stmt.free();
  return null;
}

/** Get all rows. */
export function dbAll<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
  const d = getDb();
  const stmt = d.prepare(sql);
  if (params) stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const row: Record<string, unknown> = {};
    cols.forEach((c: string, i: number) => { row[c] = vals[i]; });
    rows.push(row as T);
  }
  stmt.free();
  return rows;
}

/** Raw export of the current database file as bytes (for JSON/backup export). */
export function exportDatabaseBytes(): Uint8Array {
  return getDb().export();
}

export function currentDbPath(): string {
  return activeDbPath();
}

/**
 * Copy the live database to a new location and switch to it. The old file is
 * left in place so the user always has a fallback copy.
 */
export function moveDatabase(newPath: string): string {
  persist();
  const from = activeDbPath();
  // If they point at an existing directory, write our standard filename into it.
  let target = newPath;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'wordforge.db');
  }
  fs.copyFileSync(from, target);
  setDbPath(target);
  return target;
}

export function defaultLocation(): string {
  return defaultDbPath();
}

export function closeDatabase(): void {
  if (db) {
    persist();
    db.close();
    db = null;
  }
}
