import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { registerGoogleCallback, initGoogle, promptGoogle, isGoogleReady } from '../utils/google';
import Modal from '../components/Modal.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

export default function RegisterPage() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      setSuccessMessage('Your account has been created successfully.');
      setSuccessOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeSuccessModal = useCallback(() => {
    setSuccessOpen(false);
    navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    let timeout;
    if (successOpen) {
      timeout = window.setTimeout(() => {
        closeSuccessModal();
      }, 1800);
    }
    return () => window.clearTimeout(timeout);
  }, [successOpen, closeSuccessModal]);

  const handleGoogleSignUp = () => {
    setError('');
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setError(
        'Google sign-up is not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env and restart the app.'
      );
      return;
    }
    if (!isGoogleReady()) {
      setError('Google sign-up is still loading. Please wait a moment and try again.');
      return;
    }

    registerGoogleCallback(async (response) => {
      if (!response?.credential) {
        setError('Google sign-up failed.');
        return;
      }
      try {
        await googleLogin({ idToken: response.credential, portal: 'patient' });
        setSuccessMessage('Your Google account has been connected successfully.');
        setSuccessOpen(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
      }
    });

    initGoogle(import.meta.env.VITE_GOOGLE_CLIENT_ID);
    promptGoogle();
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        <div className="auth-brand">
          <span className="auth-brand-mark">✚</span>
          <div>
            <div className="page-eyebrow">TERRALINK Health</div>
            <h2 className="auth-header-title">Create your account</h2>
          </div>
        </div>
        <div className="auth-header-actions">
          <Link to="/login" className="btn btn-secondary">Sign in</Link>
        </div>
      </div>
      <div className="auth-layout auth-layout-wide">
        <section className="auth-panel auth-panel-featured auth-hero-panel">
          <div className="auth-hero-badges">
            <span className="badge badge-confirmed">Patient-first</span>
            <span className="badge badge-completed">Secure access</span>
          </div>
          <div className="page-eyebrow auth-pretitle">
            Get started with secure patient portal access
          </div>
          <h1 className="auth-title">One account for appointments, messaging, and care coordination</h1>
          <p className="auth-copy">
            Create a secure account to manage appointments, registration, messages, and virtual visits in one polished care workspace.
          </p>
          <div className="auth-hero-stats">
            <div className="auth-hero-stat">
              <span>Fast registration</span>
              <strong>Set up your patient account and access care tools quickly</strong>
            </div>
            <div className="auth-hero-stat">
              <span>Connected care</span>
              <strong>Secure access for patients to appointments, messages, and telehealth</strong>
            </div>
          </div>
          <div className="auth-hero-list">
            <div className="auth-tile">
              <span>Patient intake</span>
              <strong>Complete forms, verify details, and prepare for care</strong>
            </div>
            <div className="auth-tile">
              <span>Platform access</span>
              <strong>Unified navigation for patients and providers</strong>
            </div>
          </div>
          <div className="auth-feature-list auth-feature-highlight">
            <div className="auth-feature-item">Encrypted registration and secure patient profiles</div>
            <div className="auth-feature-item">Scheduling, messaging, and follow-up in one place</div>
            <div className="auth-feature-item">A seamless patient experience across care pathways</div>
          </div>
        </section>

        <Card className="auth-panel auth-card auth-card-form">
          <p className="page-eyebrow">Patient registration</p>
          <h2>Create your TERRALINK Health patient account</h2>
          <p className="auth-card-description">
            Register to manage appointments, messages, and telehealth care securely.
          </p>
          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="register-first-name">First name</label>
                <input id="register-first-name" name="firstName" required value={form.firstName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="register-last-name">Last name</label>
                <input id="register-last-name" name="lastName" required value={form.lastName} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="register-email">Email</label>
              <input id="register-email" type="email" name="email" required value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="register-phone">Phone</label>
              <input id="register-phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Password (min. 8 characters)</label>
              <input
                id="register-password"
                type="password"
                name="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Register'}
            </Button>
            <Button variant="google" type="button" onClick={handleGoogleSignUp}>
              <span className="google-icon">G</span>
              Sign up with Google
            </Button>
            {/* No development bypass button; use a real Google Client ID for sign-up */}
          </form>
          <Modal open={successOpen} title="Registration complete" onClose={closeSuccessModal} variant="success">
            <div className="modal-success-state">
              <div className="success-pill">
                <span className="success-icon">✓</span>
                <span>{successMessage || 'Your account is ready.'}</span>
              </div>
              <p>One moment while we prepare your dashboard.</p>
              <div className="loading-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <button className="btn btn-success" type="button" onClick={closeSuccessModal}>
              Continue to dashboard
            </button>
          </Modal>
          <p style={{ marginTop: 16, fontSize: '0.88rem' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <div className="card auth-tip-card" style={{ padding: 16, marginTop: 12 }}>
            <div className="page-eyebrow">What you&apos;ll get</div>
            <p className="section-copy" style={{ marginBottom: 0 }}>
              A patient account that unlocks appointments, messaging, and virtual care while keeping your care journey connected with providers.
            </p>
          </div>
          <p style={{ marginTop: 8, fontSize: '0.88rem' }}>
            <Link to="/">Back to overview</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
