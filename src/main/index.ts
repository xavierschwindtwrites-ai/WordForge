import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'fs';
import { initDatabase, closeDatabase, currentDbPath, moveDatabase, exportDatabaseBytes } from '../db/database';
import { setNanoMode } from '../db/config';
import * as q from '../db/queries';
import type {
  NewProjectInput,
  UpdateProjectInput,
  NewSessionInput,
  ProjectStatus,
} from '../types/models';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#0f0f0f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

function registerIpcHandlers(): void {
  // ---- Projects ----
  ipcMain.handle('project:list', (_, status?: ProjectStatus) => q.listProjects(status));
  ipcMain.handle('project:get', (_, id: number) => q.getProject(id));
  ipcMain.handle('project:progress', (_, id: number) => {
    const project = q.getProject(id);
    return project ? q.computeProgress(project) : null;
  });
  ipcMain.handle('project:create', (_, input: NewProjectInput) => q.createProject(input));
  ipcMain.handle('project:update', (_, id: number, input: UpdateProjectInput) => q.updateProject(id, input));
  ipcMain.handle('project:set-status', (_, id: number, status: ProjectStatus) => q.setProjectStatus(id, status));
  ipcMain.handle('project:new-draft', (_, id: number) => q.startNewDraft(id));
  ipcMain.handle('project:delete', (_, id: number) => q.deleteProject(id));

  // ---- Sessions ----
  ipcMain.handle('session:log', (_, input: NewSessionInput) => q.logSession(input));
  ipcMain.handle('session:recent', (_, projectId: number, limit?: number) => q.recentSessions(projectId, limit));
  ipcMain.handle('session:delete', (_, id: number) => q.deleteSession(id));

  // ---- Milestones ----
  ipcMain.handle('milestone:list', (_, projectId: number) => q.listMilestones(projectId));
  ipcMain.handle('milestone:add', (_, projectId: number, label: string, words: number) =>
    q.addCustomMilestone(projectId, label, words));

  // ---- Dashboard & analytics ----
  ipcMain.handle('dashboard:get', () => q.getDashboard());
  ipcMain.handle('analytics:get', () => q.getAnalytics());

  // ---- Settings ----
  ipcMain.handle('settings:get', () => q.getSettings(currentDbPath(), app.getVersion()));
  ipcMain.handle('settings:set-goal', (_, target: number) => { q.setDailyGoal(target); });
  ipcMain.handle('settings:set-nano', (_, on: boolean) => { setNanoMode(on); });

  // ---- Database location ----
  ipcMain.handle('db:path', () => currentDbPath());
  ipcMain.handle('db:move', async () => {
    const res = await dialog.showOpenDialog({
      title: 'Choose a folder for your WordForge database',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Move database here',
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return moveDatabase(res.filePaths[0]);
  });

  // ---- Exports ----
  ipcMain.handle('export:csv', async () => {
    const res = await dialog.showSaveDialog({
      title: 'Export sessions as CSV',
      defaultPath: 'wordforge-sessions.csv',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, q.exportSessionsCSV(), 'utf-8');
    return res.filePath;
  });
  ipcMain.handle('export:json', async () => {
    const res = await dialog.showSaveDialog({
      title: 'Export full database as JSON',
      defaultPath: 'wordforge-backup.json',
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, q.exportFullJSON(), 'utf-8');
    return res.filePath;
  });
  ipcMain.handle('export:sqlite', async () => {
    const res = await dialog.showSaveDialog({
      title: 'Export raw SQLite database',
      defaultPath: 'wordforge.db',
      filters: [{ name: 'SQLite', extensions: ['db', 'sqlite'] }],
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, Buffer.from(exportDatabaseBytes()));
    return res.filePath;
  });
}

app.on('ready', async () => {
  await initDatabase();
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
