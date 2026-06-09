import type {
  Project,
  ProjectProgress,
  ProjectStatus,
  Session,
  Milestone,
  NewProjectInput,
  UpdateProjectInput,
  NewSessionInput,
  SessionResult,
  DashboardData,
  AnalyticsData,
  Settings,
} from './models';

interface WordForgeAPI {
  // Projects
  listProjects(status?: ProjectStatus): Promise<Project[]>;
  getProject(id: number): Promise<Project | null>;
  getProgress(id: number): Promise<ProjectProgress | null>;
  createProject(input: NewProjectInput): Promise<Project>;
  updateProject(id: number, input: UpdateProjectInput): Promise<Project | null>;
  setProjectStatus(id: number, status: ProjectStatus): Promise<Project | null>;
  startNewDraft(id: number): Promise<Project | null>;
  deleteProject(id: number): Promise<void>;

  // Sessions
  logSession(input: NewSessionInput): Promise<SessionResult>;
  recentSessions(projectId: number, limit?: number): Promise<Session[]>;
  deleteSession(id: number): Promise<void>;

  // Milestones
  listMilestones(projectId: number): Promise<Milestone[]>;
  addMilestone(projectId: number, label: string, words: number): Promise<Milestone>;

  // Dashboard & analytics
  getDashboard(): Promise<DashboardData>;
  getAnalytics(): Promise<AnalyticsData>;

  // Settings
  getSettings(): Promise<Settings>;
  setDailyGoal(target: number): Promise<void>;
  setNanoMode(on: boolean): Promise<void>;

  // Database & exports
  getDbPath(): Promise<string>;
  moveDatabase(): Promise<string | null>;
  exportCSV(): Promise<string | null>;
  exportJSON(): Promise<string | null>;
  exportSQLite(): Promise<string | null>;
}

declare global {
  interface Window {
    wordforge: WordForgeAPI;
  }
}
