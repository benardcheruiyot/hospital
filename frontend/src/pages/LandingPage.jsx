import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((response) => setApiStatus(response.ok ? 'online' : 'offline'))
      .catch(() => setApiStatus('offline'));
  }, []);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      <header className="reference-header">
        <Link className="reference-brand" to="/">
          <span className="reference-brand-mark">✚</span>
          <span>
            <strong>TERRALINK Health</strong>
            <small>Digital Hospital Platform</small>
          </span>
        </Link>
        <div className="reference-header-actions">
          <Link className="reference-nav-link" to="/portal/patient">Patient Login</Link>
          <Link className="reference-nav-link reference-nav-link-solid" to="/portal/staff">Staff Login</Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-intro" aria-label="TERRALINK Health overview">
          <div>
            <p className="reference-kicker">Digital care access</p>
            <h1>Healthcare, without the runaround.</h1>
            <p>Book visits, stay in touch with your care team, and manage your hospital journey from one secure account.</p>
            <div className="landing-status" aria-live="polite">
              <span className={`status-dot status-${apiStatus}`} />
              {apiStatus === 'checking' ? 'Checking service status' : apiStatus === 'online' ? 'Services operational' : 'Service status unavailable'}
            </div>
          </div>
          <div className="landing-intro-mark" aria-hidden="true">✚</div>
        </section>

        <section className="landing-access" aria-label="Portal access">
          <div className="landing-section-heading">
            <p className="reference-kicker">Choose your access</p>
            <h2>Start where you are</h2>
          </div>
          <div className="landing-access-grid">
            <Link className="landing-access-card" to="/login?portal=patient">
              <span className="landing-access-label">For patients</span>
              <h3>Patient portal</h3>
              <p>Appointments, registration, messages, and virtual visits.</p>
              <strong>Sign in <span aria-hidden="true">→</span></strong>
            </Link>
            <Link className="landing-access-card landing-access-card-dark" to="/login?portal=staff">
              <span className="landing-access-label">For care teams</span>
              <h3>Staff portal</h3>
              <p>Schedules, consultations, patient workflows, and telehealth.</p>
              <strong>Sign in <span aria-hidden="true">→</span></strong>
            </Link>
          </div>
        </section>
      </main>

      <footer className="reference-footer">
        <div>
          <strong>TERRALINK Health</strong>
          <span>Digital Hospital Platform</span>
        </div>
        <p>© 2026 TERRALINK Health — Digital Hospital Management Platform</p>
        <p>Enhancing Hospital Operations &amp; Patient Experience in Nairobi County, Kenya</p>
      </footer>
    </div>
  );
}