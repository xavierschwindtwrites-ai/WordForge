import React, { useState, useCallback } from 'react';
import Sidebar from './components/sidebar';
import Dashboard from './components/dashboard';
import ProjectLibrary from './components/project-library';
import ProjectDetail from './components/project-detail';
import Analytics from './components/analytics';
import SprintScreen from './components/sprint-screen';
import Settings from './components/settings';
import LogSessionModal from './components/log-session-modal';
import MilestoneModal from './components/milestone-modal';
import type { Milestone, SessionResult } from '../types/models';
import './styles/global.css';

export type Screen = 'Dashboard' | 'Library' | 'Analytics' | 'Sprint' | 'Settings';

export interface View {
  screen: Screen;
  projectId?: number; // when set (with screen 'Library'), shows project detail
}

const App: React.FC = () => {
  const [view, setView] = useState<View>({ screen: 'Dashboard' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [logModal, setLogModal] = useState<{ open: boolean; projectId?: number }>({ open: false });
  const [celebration, setCelebration] = useState<Milestone[]>([]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const openLog = useCallback((projectId?: number) => {
    setLogModal({ open: true, projectId });
  }, []);

  const navigate = useCallback((screen: Screen) => {
    setView({ screen });
  }, []);

  const openProject = useCallback((projectId: number) => {
    setView({ screen: 'Library', projectId });
  }, []);

  const handleLogged = useCallback((result: SessionResult) => {
    setLogModal({ open: false });
    refresh();
    if (result.milestones_crossed.length > 0) {
      setCelebration(result.milestones_crossed);
    }
  }, [refresh]);

  const renderScreen = () => {
    if (view.screen === 'Library' && view.projectId != null) {
      return (
        <ProjectDetail
          key={`${view.projectId}-${refreshKey}`}
          projectId={view.projectId}
          onBack={() => setView({ screen: 'Library' })}
          onLogSession={openLog}
          onChanged={refresh}
        />
      );
    }
    switch (view.screen) {
      case 'Dashboard':
        return (
          <Dashboard
            key={refreshKey}
            onLogSession={openLog}
            onOpenProject={openProject}
            onNavigate={navigate}
          />
        );
      case 'Library':
        return (
          <ProjectLibrary
            key={refreshKey}
            onOpenProject={openProject}
            onChanged={refresh}
          />
        );
      case 'Analytics':
        return <Analytics key={refreshKey} />;
      case 'Sprint':
        return <SprintScreen onLogSession={openLog} />;
      case 'Settings':
        return <Settings key={refreshKey} onChanged={refresh} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeScreen={view.screen}
        onNavigate={navigate}
        onLogSession={() => openLog()}
      />
      <main className="content-area">{renderScreen()}</main>

      {logModal.open && (
        <LogSessionModal
          initialProjectId={logModal.projectId}
          onLogged={handleLogged}
          onClose={() => setLogModal({ open: false })}
        />
      )}

      {celebration.length > 0 && (
        <MilestoneModal
          milestones={celebration}
          onClose={() => setCelebration([])}
        />
      )}
    </div>
  );
};

export default App;
