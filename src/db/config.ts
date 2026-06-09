import path from 'path';
import fs from 'fs';
import { app } from 'electron';

// Lightweight app configuration persisted as JSON in userData. Holds things
// that live outside the SQLite database itself — most importantly the database
// file location (so users can move it into a Dropbox/iCloud folder) and the
// NaNoWriMo overlay toggle.

interface AppConfig {
  dbPath?: string;
  nanoMode?: boolean;
}

function configPath(): string {
  return path.join(app.getPath('userData'), 'wordforge-config.json');
}

let cache: AppConfig | null = null;

function read(): AppConfig {
  if (cache) return cache;
  const p = configPath();
  if (fs.existsSync(p)) {
    try {
      cache = JSON.parse(fs.readFileSync(p, 'utf-8')) as AppConfig;
    } catch {
      cache = {};
    }
  } else {
    cache = {};
  }
  return cache;
}

function write(next: AppConfig): void {
  cache = next;
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2));
}

export function defaultDbPath(): string {
  return path.join(app.getPath('userData'), 'wordforge.db');
}

export function getDbPath(): string {
  const cfg = read();
  return cfg.dbPath || defaultDbPath();
}

export function setDbPath(newPath: string): void {
  const cfg = read();
  write({ ...cfg, dbPath: newPath });
}

export function getNanoMode(): boolean {
  return read().nanoMode === true;
}

export function setNanoMode(on: boolean): void {
  const cfg = read();
  write({ ...cfg, nanoMode: on });
}
