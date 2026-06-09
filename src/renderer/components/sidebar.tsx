import React from 'react';
import type { Screen } from '../app';
import Logo from './logo';

const NAV: { screen: Screen; label: string; icon: React.ReactNode }[] = [
  { screen: 'Dashboard', label: 'Dashboard', icon: <IconHome /> },
  { screen: 'Library', label: 'Projects', icon: <IconBook /> },
  { screen: 'Analytics', label: 'Analytics', icon: <IconChart /> },
  { screen: 'Sprint', label: 'Sprint', icon: <IconTimer /> },
  { screen: 'Settings', label: 'Settings', icon: <IconGear /> },
];

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (s: Screen) => void;
  onLogSession: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate, onLogSession }) => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <span className="sidebar-logo"><Logo /></span>
      <span className="sidebar-logo-text">WordForge</span>
    </div>

    <button className="log-session-btn" onClick={onLogSession}>
      <span className="log-session-plus">+</span> Log Session
    </button>

    <nav className="sidebar-nav">
      {NAV.map(item => (
        <button
          key={item.screen}
          className={`nav-item${activeScreen === item.screen ? ' active' : ''}`}
          onClick={() => onNavigate(item.screen)}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>

    <div className="sidebar-footer">
      <span className="sidebar-tagline">Write every day.</span>
      <span className="sidebar-version">v0.1.1</span>
    </div>
  </aside>
);

function IconHome() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z" /><path d="M8 3v18" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" />
    </svg>
  );
}
function IconTimer() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" /><path d="M12 13V9" /><path d="M9 2h6" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export default Sidebar;
