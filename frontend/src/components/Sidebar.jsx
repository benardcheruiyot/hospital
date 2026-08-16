import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ user, items = [], unreadMessages = 0, onLogout }) {
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '';
  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'doctor'
      ? 'Healthcare Provider'
      : 'Patient';

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-brand">
        <div className="sidebar-brand-top">
          <div className="workspace-brand-mark">✚</div>
          <div>
            <p className="sidebar-kicker">Digital Hospital Platform</p>
            <h1 className="sidebar-brand-title">TERRALINK Health</h1>
          </div>
        </div>
        <p className="sidebar-copy">Your connected care workspace for patients, providers, and administrators.</p>
      </div>
      <nav>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.to === '/messages' && unreadMessages > 0 && <span className="nav-badge" />}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-profile-card">
        <div className="sidebar-profile-top">
          <div className="sidebar-profile-avatar">{initials}</div>
          <div className="sidebar-profile-meta">
            <strong>{user?.firstName} {user?.lastName}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
        <button className="btn btn-secondary sidebar-logout-button" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
