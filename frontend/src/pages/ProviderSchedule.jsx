import React from 'react';
import AppShell from '../components/AppShell.jsx';

export default function ProviderSchedule() {
  return (
    <AppShell>
      <section className="hero-card">
        <div>
          <div className="page-eyebrow">Clinical operations</div>
          <h2>My Schedule</h2>
          <p className="section-copy">Set availability and review today's appointments.</p>
        </div>
        <div className="hero-actions hero-summary">
          <button className="btn btn-secondary">Set Availability</button>
        </div>
      </section>

      <div className="card">
        <div className="page-eyebrow">Today's Schedule — Friday, July 24, 2026</div>
        <div style={{ marginTop: 12 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ padding: 12, borderBottom: '1px solid rgba(23,105,194,0.06)' }}>
              <div><strong>08:00 - 08:30</strong></div>
              <div>Mary Wambui — Chest pain · <span style={{ color: 'var(--color-primary-dark)' }}>In Progress</span></div>
            </li>
            <li style={{ padding: 12, borderBottom: '1px solid rgba(23,105,194,0.06)' }}>
              <div><strong>08:30 - 09:00</strong></div>
              <div>John Mwangi — HTN Follow-up · <span style={{ color: 'var(--color-muted)' }}>Waiting</span></div>
            </li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
