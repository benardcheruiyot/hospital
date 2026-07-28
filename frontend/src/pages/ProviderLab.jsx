import React from 'react';
import AppShell from '../components/AppShell.jsx';

export default function ProviderLab() {
  return (
    <AppShell>
      <section className="hero-card">
        <div>
          <div className="page-eyebrow">Clinical operations</div>
          <h2>Lab Orders & Results</h2>
          <p className="section-copy">View lab orders, enter and review results.</p>
        </div>
        <div className="hero-actions hero-summary">
          <button className="btn">New Order</button>
        </div>
      </section>

      <div className="card">
        <div className="page-eyebrow">Pending (4)</div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: 12, borderBottom: '1px solid rgba(23,105,194,0.06)' }}>
            <div><strong>Complete Blood Count</strong></div>
            <div>Mary Wambui · ID: P001 · <span style={{ color: '#c06500' }}>Urgent</span></div>
          </li>
          <li style={{ padding: 12, borderBottom: '1px solid rgba(23,105,194,0.06)' }}>
            <div><strong>Troponin I</strong></div>
            <div>Mary Wambui · ID: P001 · <span style={{ color: '#c06500' }}>STAT</span></div>
          </li>
        </ul>
      </div>
    </AppShell>
  );
}
