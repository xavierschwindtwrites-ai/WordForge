import { contextBridge, ipcRenderer } from 'electron';
import type {
  NewProjectInput,
  UpdateProjectInput,
  NewSessionInput,
  ProjectStatus,
} from '../types/models';

contextBridge.exposeInMainWorld('wordforge', {
  // Projects
  listProjects: (status?: ProjectStatus) => ipcRenderer.invoke('project:list', status),
  getProject: (id: number) => ipcRenderer.invoke('project:get', id),
  getProgress: (id: number) => ipcRenderer.invoke('project:progress', id),
  createProject: (input: NewProjectInput) => ipcRenderer.invoke('project:create', input),
  updateProject: (id: number, input: UpdateProjectInput) => ipcRenderer.invoke('project:update', id, input),
  setProjectStatus: (id: number, status: ProjectStatus) => ipcRenderer.invoke('project:set-status', id, status),
  startNewDraft: (id: number) => ipcRenderer.invoke('project:new-draft', id),
  deleteProject: (id: number) => ipcRenderer.invoke('project:delete', id),

  // Sessions
  logSession: (input: NewSessionInput) => ipcRenderer.invoke('session:log', input),
  recentSessions: (projectId: number, limit?: number) => ipcRenderer.invoke('session:recent', projectId, limit),
  deleteSession: (id: number) => ipcRenderer.invoke('session:delete', id),

  // Milestones
  listMilestones: (projectId: number) => ipcRenderer.invoke('milestone:list', projectId),
  addMilestone: (projectId: number, label: string, words: number) =>
    ipcRenderer.invoke('milestone:add', projectId, label, words),

  // Dashboard & analytics
  getDashboard: () => ipcRenderer.invoke('dashboard:get'),
  getAnalytics: () => ipcRenderer.invoke('analytics:get'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setDailyGoal: (target: number) => ipcRenderer.invoke('settings:set-goal', target),
  setNanoMode: (on: boolean) => ipcRenderer.invoke('settings:set-nano', on),

  // Database & exports
  getDbPath: () => ipcRenderer.invoke('db:path'),
  moveDatabase: () => ipcRenderer.invoke('db:move'),
  exportCSV: () => ipcRenderer.invoke('export:csv'),
  exportJSON: () => ipcRenderer.invoke('export:json'),
  exportSQLite: () => ipcRenderer.invoke('export:sqlite'),
});
