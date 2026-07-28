import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [portal, setPortal] = useState(searchParams.get('portal') === 'staff' ? 'staff' : 'patient');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ ...form, portal });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePortalChange = (nextPortal) => {
    setPortal(nextPortal);
    setSearchParams({ portal: nextPortal });
    setError('');
  };

  const handleGoogleSignIn = () => {
    setError('');
    if (!window.google?.accounts?.id || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setError('Google sign-in is unavailable right now.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if (!response?.credential) {
          setError('Google sign-in failed.');
          return;
        }
        try {
          await googleLogin({ idToken: response.credential, portal });
          navigate('/dashboard');
        } catch (err) {
          setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
        }
      },
      ux_mode: 'popup',
    });
    window.google.accounts.id.prompt();
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        <div className="auth-brand">
          <span className="auth-brand-mark">✚</span>
          <div>
            <div className="page-eyebrow">TERRALINK Health</div>
            <h2 className="auth-header-title">Secure portal access</h2>
          </div>
        </div>
        <div className="auth-header-actions">
          <Link to="/register" className="btn btn-secondary">Create account</Link>
        </div>
      </div>
      <div className="auth-layout auth-layout-wide">
        <section className="auth-panel auth-panel-featured auth-hero-panel">
          <div className="auth-hero-badges">
            <span className="badge badge-confirmed">Secure access</span>
            <span className="badge badge-scheduled">Unified login</span>
            <span className="badge badge-completed">Role-aware workspace</span>
          </div>
          <div className="page-eyebrow auth-pretitle">
            One shared workspace for patients and hospital staff
          </div>
          <h1 className="auth-title">Sign in to your care workspace</h1>
          <p className="auth-copy">
            {portal === 'patient'
              ? 'Sign in to manage your appointments, registration, messaging, and telehealth care.'
              : 'Sign in to manage patient workflows, schedules, consultations, and hospital operations.'}
          </p>
          <div className="auth-hero-stats">
            <div className="auth-hero-stat">
              <span>{portal === 'patient' ? 'Patient access' : 'Provider access'}</span>
              <strong>{portal === 'patient' ? 'Your care tools ready in one place' : 'Your clinical workspace ready to use'}</strong>
            </div>
            <div className="auth-hero-stat">
              <span>Shared platform</span>
              <strong>{portal === 'patient' ? 'Same ecosystem for patients and staff' : 'Unified system with role-based controls'}</strong>
            </div>
          </div>
          <div className="auth-hero-list">
            <div className="auth-tile">
              <span>{portal === 'patient' ? 'Patient journey' : 'Provider workflow'}</span>
              <strong>{portal === 'patient' ? 'Appointments, intake, follow-up' : 'Consults, notes, schedules'}</strong>
            </div>
            <div className="auth-tile">
              <span>Connected care</span>
              <strong>{portal === 'patient' ? 'One account for your health experience' : 'One workspace for your care team'}</strong>
            </div>
          </div>
          <div className="auth-feature-list auth-feature-highlight">
            <div className="auth-feature-item">Secure sign-in with the same workspace for every role</div>
            <div className="auth-feature-item">Patient and staff portals in one unified platform</div>
            <div className="auth-feature-item">Telemedicine, messaging, and scheduling together</div>
          </div>
        </section>

        <section className="auth-panel auth-card auth-card-form">
          <p className="page-eyebrow">Shared portal access</p>
          <h2>{portal === 'patient' ? 'Patient Portal Sign In' : 'Staff Portal Sign In'}</h2>
          <p className="auth-card-description">
            {portal === 'patient'
              ? 'Enter your email and password to access your patient care tools.'
              : 'Enter your staff credentials to access your hospital workspace.'}
          </p>
          <div className="portal-switcher" role="tablist" aria-label="Choose login portal">
            <button
              className={portal === 'patient' ? 'portal-switch active' : 'portal-switch'}
              type="button"
              onClick={() => handlePortalChange('patient')}
            >
              Patient
            </button>
            <button
              className={portal === 'staff' ? 'portal-switch active' : 'portal-switch'}
              type="button"
              onClick={() => handlePortalChange('staff')}
            >
              Staff
            </button>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" name="email" required value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
            <button type="button" className="google-btn" onClick={handleGoogleSignIn}>
              <span className="google-icon">G</span>
              Sign in with Google
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: '0.88rem' }}>
            {portal === 'patient' ? (
              <>Don&apos;t have an account? <Link to="/register">Register</Link></>
            ) : (
              'Staff accounts are provisioned by your hospital administrator.'
            )}
          </p>
          <div className="card auth-tip-card" style={{ padding: 16, marginTop: 12 }}>
            <div className="page-eyebrow">Tip</div>
            <p className="section-copy" style={{ marginBottom: 0 }}>
              Use the same account across dashboard, registration, messaging, and telemedicine to keep the full care journey in one place.
            </p>
          </div>
          <p style={{ marginTop: 8, fontSize: '0.88rem' }}>
            <Link to="/">Back to TERRALINK Health</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
