import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';

export default function ProviderConsultation() {
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [patient, setPatient] = useState({ name: 'Mary Wambui' });

  const { search } = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(search);
    const patientName = params.get('patient');
    if (patientName) setPatient({ name: decodeURIComponent(patientName) });
  }, [search]);

  const handleSave = () => {
    // stub save (client-side)
    setMessage('Notes saved');
    setTimeout(() => setMessage(''), 2200);
  };

  return (
    <AppShell>
      <section className="hero-card">
        <div>
          <div className="page-eyebrow">Clinical operations</div>
          <h2>Consultation</h2>
          <p className="section-copy">Telemedicine session, patient summary, and clinical documentation in one place.</p>
        </div>
        <div className="hero-actions hero-summary">
          <button className="btn">Start Video Call</button>
        </div>
      </section>

      <div className="grid grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="page-eyebrow">Telemedicine Session</div>
          <h3 style={{ marginTop: 6 }}>Patient: {patient.name}</h3>
          <p className="section-copy">Click "Start Video Call" to connect with patient</p>
        </div>

        <div className="card">
          <div className="page-eyebrow">Patient Summary</div>
            <div>
              <div><strong>Name:</strong> {patient.name}</div>
              <div><strong>Age:</strong> 34 years</div>
              <div><strong>Gender:</strong> Female</div>
              <div><strong>Chief Complaint:</strong> Chest pain</div>
              <div><strong>Priority:</strong> Urgent</div>
              <div><strong>Allergies:</strong> Penicillin</div>
              <div><strong>Vitals:</strong> BP 130/85 · HR 88 bpm · Temp 37.1°C · SpO2 98%</div>
            </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="page-eyebrow">Clinical Documentation</div>
        <h3 style={{ marginTop: 6 }}>Consultation Notes</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Document patient history..." rows={6} style={{ width: '100%', padding: 12, borderRadius: 10 }} />
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn" onClick={handleSave}>Save Notes</button>
          {message && <div className="toast-dot" style={{ marginLeft: 6 }} />}
          {message && <div style={{ color: 'var(--color-primary-dark)', fontWeight: 700 }}>{message}</div>}
        </div>
      </div>
    </AppShell>
  );
}
