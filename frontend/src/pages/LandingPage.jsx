import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: '↗', title: 'Reduced Wait Times', body: 'Real-time queue tracking and online appointment booking' },
  { icon: '▣', title: 'Secure Records', body: 'Encrypted patient data with role-based access control' },
  { icon: '◉', title: 'Telemedicine', body: 'Virtual consultations from anywhere in Kenya' },
  { icon: '▥', title: 'Real-Time Analytics', body: 'Live dashboards for hospital performance monitoring' },
];

const PORTALS = [
  {
    icon: '＋',
    title: 'Patient Portal',
    body: 'Sign in to manage appointments, registration, messaging, and telemedicine.',
    to: '/portal/patient',
  },
  {
    icon: '♧',
    title: 'Healthcare Provider',
    body: 'Sign in to manage patient workflows, schedules, and virtual consultations.',
    to: '/portal/staff',
  },
  {
    icon: '⌘',
    title: 'Administrator',
    body: 'Sign in for hospital operations, user provisioning, and analytics.',
    to: '/admin',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

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

      <section className="reference-hero">
        <div className="reference-hero-art" aria-hidden="true">
          <div className="reference-orbit reference-orbit-one" />
          <div className="reference-orbit reference-orbit-two" />
          <div className="reference-cross">✚</div>
          <div className="reference-art-card reference-art-card-top">24/7<br /><strong>Connected care</strong></div>
          <div className="reference-art-card reference-art-card-bottom">Live queue<br /><strong>Updated now</strong></div>
        </div>
        <div className="reference-hero-copy">
          <div className="reference-kicker"><span>✦</span> Transforming Healthcare in Kenya</div>
          <h1>Enhancing Hospital Operations <span>&amp; Patient Experience</span></h1>
          <p>An integrated digital platform for patient engagement, digital registration, telemedicine, and real-time analytics — built for Kenyan hospitals.</p>
          <div className="reference-hero-actions">
            <Link className="reference-primary-action" to="/register"><span>＋</span> Get Started — Register</Link>
            <Link className="reference-secondary-action" to="/login?portal=patient"><span>♧</span> Sign In</Link>
          </div>
        </div>
      </section>

      <section className="reference-features" aria-label="Platform benefits">
        {FEATURES.map((feature) => (
          <article className="reference-feature" key={feature.title}>
            <div className="reference-feature-icon">{feature.icon}</div>
            <div>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="reference-portals">
        <div className="reference-section-heading">
          <p className="reference-kicker">Your care, connected</p>
          <h2>Access Your Portal</h2>
          <p>Select your role to get started</p>
        </div>
        <div className="reference-portal-grid">
          {PORTALS.map((portal) => (
            <Link className="reference-portal-card" to={portal.to} key={portal.title}>
              <div className="reference-portal-icon">{portal.icon}</div>
              <h3>{portal.title}</h3>
              <p>{portal.body}</p>
              <span className="reference-portal-link">Enter Portal <b>→</b></span>
            </Link>
          ))}
        </div>
      </section>

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