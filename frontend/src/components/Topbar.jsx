import React from 'react';

export default function Topbar({ user, roleLabel, toggleMenu, menuOpen }) {
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '';
  return (
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
        <div className="profile-badge" aria-label="User profile">{initials}</div>
        <div className="profile-summary">
          <div>{user?.firstName} {user?.lastName}</div>
          <div className="profile-summary-role">{roleLabel}</div>
        </div>
      </div>
    </div>
  );
}
