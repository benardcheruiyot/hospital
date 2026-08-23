import React from 'react';
import { Link } from 'react-router-dom';

const PATIENT_FEATURES = [
  { icon: '📅', title: 'Appointments', body: 'Book, review, and check in for visits.' },
  { icon: '💬', title: 'Messages', body: 'Secure messages with care teams.' },
  { icon: '📄', title: 'Records', body: 'View your visit notes and documents.' },
  { icon: '📺', title: 'Telemedicine', body: 'Join virtual consultations in one click.' },
];

export default function PatientPortal() {
  return (
    <div className="landing-page">
      <header className="reference-header">
        <div className="reference-brand">
          <span className="reference-brand-mark">✚</span>
          <div>
            <strong>TERRALINK Health</strong>
            <small>Patient Portal</small>
          </div>
        </div>
        <div className="reference-header-actions">
          <Link className="reference-nav-link reference-nav-link-solid" to="/login?portal=patient">Sign in</Link>
        </div>
      </header>

      <main>
      <section className="reference-hero" aria-label="Patient portal overview">
        <div className="reference-hero-copy">
          <div className="reference-kicker">Patient Portal</div>
          <h1>Welcome to your care workspace</h1>
          <p>Book appointments, view records, pay bills, and access telemedicine services.</p>
          <div className="reference-hero-actions">
            <Link className="reference-primary-action" to="/login?portal=patient">Enter Portal →</Link>
            <Link className="reference-secondary-action" to="/register">Register</Link>
          </div>
        </div>
        <div className="reference-hero-art" aria-hidden="true" />
      </section>

      <section className="reference-features" aria-label="Patient portal features">
        {PATIENT_FEATURES.map((f) => (
          <article className="reference-feature" key={f.title}>
            <div className="reference-feature-icon">{f.icon}</div>
            <div>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </div>
          </article>
        ))}
      </section>
      </main>

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
