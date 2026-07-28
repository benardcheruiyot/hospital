import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminPortal() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ email: form.username, password: form.password, portal: 'admin' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        <div className="auth-brand">
          <span className="auth-brand-mark">✚</span>
          <div>
            <div className="page-eyebrow">TERRALINK Health</div>
            <h2 className="auth-header-title">Admin sign in</h2>
          </div>
        </div>
        <div className="auth-header-actions">
          <Link to="/login" className="btn btn-secondary">Patient / Staff sign in</Link>
        </div>
      </div>
      <div className="auth-layout auth-layout-wide">
        <section className="auth-panel auth-panel-featured auth-hero-panel">
          <div className="auth-hero-badges">
            <span className="badge badge-confirmed">Admin access</span>
            <span className="badge badge-completed">Secure login</span>
          </div>
          <div className="page-eyebrow auth-pretitle">
            Secure hospital administration access
          </div>
          <h1 className="auth-title">Admin workspace login</h1>
          <p className="auth-copy">
            Sign in with your administrator credentials to manage users, reports, and hospital workflows.
          </p>
          <div className="auth-hero-list">
            <div className="auth-tile">
              <span>Admin controls</span>
              <strong>Manage staff, approve accounts, and monitor performance.</strong>
            </div>
            <div className="auth-tile">
              <span>Secure access</span>
              <strong>Only admin accounts may use this portal.</strong>
            </div>
          </div>
        </section>

        <section className="auth-panel auth-card auth-card-form">
          <p className="page-eyebrow">Administrator login</p>
          <h2>Enter admin credentials</h2>
          <p className="auth-card-description">
            Use your administrator username or email with your password.
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="admin-username">Admin username or email</label>
              <input
                id="admin-username"
                name="username"
                autoComplete="username"
                required
                value={form.username}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in as admin'}
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: '0.88rem' }}>
            <Link to="/">Back to home</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
