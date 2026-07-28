import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = {
  patient: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/profile', label: 'Profile', icon: '👤' },
    { to: '/registration', label: 'Registration', icon: '📝' },
    { to: '/appointments', label: 'Appointments', icon: '📅' },
    { to: '/messages', label: 'Messages', icon: '💬' },
  ],
  doctor: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/profile', label: 'Profile', icon: '👤' },
    { to: '/appointments', label: 'Appointments', icon: '📅' },
    { to: '/analytics', label: 'Analytics', icon: '📊' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/profile', label: 'Profile', icon: '👤' },
    { to: '/patients', label: 'Patients', icon: '🧑‍🤝‍🧑' },
    { to: '/appointments', label: 'Appointments', icon: '📅' },
    { to: '/analytics', label: 'Analytics', icon: '📊' },
  ],
};

export default function AppShell({ children }) {
  const { user, logout, unreadMessages, messageNotification } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const items = NAV_ITEMS[user?.role] || [];
  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'doctor'
      ? 'Healthcare Provider'
      : 'Patient';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
            <div className="workspace-brand-mark">✚</div>
            <div>
              <p className="sidebar-kicker">Digital Hospital Platform</p>
              <h1 className="sidebar-brand-title">TERRALINK Health</h1>
            </div>
          </div>
          <p className="sidebar-copy">
            Your connected care workspace for patients, providers, and administrators.
          </p>
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
          <button className="btn btn-secondary sidebar-logout-button" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
              <div className="topbar-left">
            <button className="mobile-menu-button" type="button" onClick={toggleMenu} aria-expanded={menuOpen} aria-label="Open navigation menu">
              <span className="menu-icon">☰</span>
            </button>
            <div className="topbar-brand">
              <div className="topbar-brand-mark">✚</div>
              <div>
                <div className="topbar-title">TERRALINK Health</div>
                <div className="topbar-subtitle">{roleLabel}</div>
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="profile-badge" aria-label="User profile">
              {initials}
            </div>
            <div className="profile-summary">
              <div>{user?.firstName} {user?.lastName}</div>
              <div className="profile-summary-role">{roleLabel}</div>
            </div>
          </div>
        </div>
        {menuOpen && <div className="mobile-menu-backdrop" onClick={closeMenu} />}
        <aside className={`mobile-menu-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
          <div className="mobile-menu-header">
            <div>
              <div className="mobile-menu-label">TERRALINK Health</div>
              <div className="mobile-menu-subtitle">{roleLabel}</div>
            </div>
            <button className="mobile-menu-close" type="button" onClick={closeMenu} aria-label="Close menu">
              ×
            </button>
          </div>
          <nav>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMenu}
              >
                {item.label}
                {item.to === '/messages' && unreadMessages > 0 && <span className="nav-badge" />}
              </NavLink>
            ))}
            <button className="btn btn-secondary mobile-logout-button" type="button" onClick={() => { closeMenu(); handleLogout(); }}>
              Sign out
            </button>
          </nav>
        </aside>
        {messageNotification && (
          <div className="message-toast">
            <span className="toast-dot" />
            {messageNotification}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
