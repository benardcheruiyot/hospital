import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

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

  return (
    <div className="app-shell">
      <Sidebar user={user} items={items} unreadMessages={unreadMessages} onLogout={handleLogout} />
      <main className="main-content">
        <Topbar user={user} roleLabel={roleLabel} toggleMenu={toggleMenu} menuOpen={menuOpen} />
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
          <nav aria-label="Mobile navigation">
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
