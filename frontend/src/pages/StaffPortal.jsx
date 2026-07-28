import React from 'react';
import { Link } from 'react-router-dom';

const STAFF_FEATURES = [
  { icon: '📋', title: 'Schedule', body: 'View and manage your clinic schedule.' },
  { icon: '🩺', title: 'Patients', body: 'Access patient charts and visit notes.' },
  { icon: '📡', title: 'Telemedicine', body: 'Start or join virtual consultations.' },
  { icon: '📊', title: 'Analytics', body: 'Monitor operational KPIs and throughput.' },
];

export default function StaffPortal() {
  return (
    <div className="landing-page">
      <header className="reference-header">
        <div className="reference-brand">
          <span className="reference-brand-mark">✚</span>
          <div>
            <strong>TERRALINK Health</strong>
            <small>Provider Portal</small>
          </div>
        </div>
        <div className="reference-header-actions">
          <Link className="reference-nav-link reference-nav-link-solid" to="/login?portal=staff">Sign in</Link>
        </div>
      </header>

      <section className="reference-hero">
        <div className="reference-hero-copy">
          <div className="reference-kicker">Provider portal</div>
          <h1>Secure workspace for hospital staff</h1>
          <p>Manage patient consults, schedules, telemedicine, and clinical workflows from one provider view.</p>
          <div className="reference-hero-actions">
            <Link className="reference-primary-action" to="/login?portal=staff">Sign in to provider portal</Link>
            <Link className="reference-secondary-action" to="/profile">My profile</Link>
          </div>
        </div>
      </section>
      <div className="reference-hero-art" aria-hidden="true" />

      <section className="reference-features">
        {STAFF_FEATURES.map((f) => (
          <article className="reference-feature" key={f.title}>
            <div className="reference-feature-icon">{f.icon}</div>
            <div>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </div>
          </article>
        ))}
      </section>

      <footer className="reference-footer">
        <div>
          <strong>TERRALINK Health</strong>
          <span>Digital Hospital Management Platform</span>
        </div>
        <p>© 2026 TERRALINK Health — Digital Hospital Management Platform</p>
      </footer>
    </div>
  );
}
