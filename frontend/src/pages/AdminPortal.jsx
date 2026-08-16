import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import {
  createDoctor,
  deleteDoctor,
  listDoctorCredentials,
  restoreDoctor,
  restoreAllInactiveDoctors,
} from '../services/doctorApi.js';

export default function AdminPortal() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doctorCredentials, setDoctorCredentials] = useState([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [credentialError, setCredentialError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', phone: '', specialty: '', password: '' });
  const [createFormErrors, setCreateFormErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);
  const [restoringDoctorId, setRestoringDoctorId] = useState(null);
  const [restoringAll, setRestoringAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoreAllConfirmOpen, setRestoreAllConfirmOpen] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const defaultPassword = 'ChangeMe123!';

  const totalDoctorAccounts = useMemo(() => doctorCredentials.length, [doctorCredentials]);
  const activeDoctorCount = useMemo(
    () => doctorCredentials.filter((doctor) => doctor.isActive).length,
    [doctorCredentials]
  );
  const inactiveDoctorCount = useMemo(
    () => doctorCredentials.filter((doctor) => !doctor.isActive).length,
    [doctorCredentials]
  );
  const seededDefaultCredentials = useMemo(
    () => doctorCredentials.filter((doctor) => doctor.loginPassword === defaultPassword).length,
    [doctorCredentials, defaultPassword]
  );

  const filteredDoctorCredentials = useMemo(
    () =>
      doctorCredentials.filter((doctor) => {
        if (statusFilter === 'active') return doctor.isActive;
        if (statusFilter === 'inactive') return !doctor.isActive;
        return true;
      }),
    [doctorCredentials, statusFilter]
  );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ email: form.username, password: form.password, portal: 'admin' });
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;

    setLoadingCredentials(true);
    setCredentialError('');

    listDoctorCredentials()
      .then(({ data }) => setDoctorCredentials(data))
      .catch((err) => {
        setCredentialError(err.response?.data?.message || 'Failed to load doctor credentials.');
      })
      .finally(() => setLoadingCredentials(false));
  }, [user]);

  const handleCreateOpen = () => {
    setCreateError('');
    setCreateForm({ firstName: '', lastName: '', email: '', phone: '', specialty: '', password: '' });
    setCreateFormErrors({});
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    setCreateFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!createForm.firstName.trim()) errors.firstName = 'First name is required.';
    if (!createForm.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!createForm.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!createForm.phone.trim()) {
      errors.phone = 'Phone is required.';
    }
    if (!createForm.specialty.trim()) errors.specialty = 'Specialty is required.';
    if (!createForm.password) {
      errors.password = 'Password is required.';
    } else if (createForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  const handleCreateDoctor = async (event) => {
    event.preventDefault();
    if (!validateCreateForm()) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      await createDoctor(createForm);
      setCreateOpen(false);
      setCreateForm({ firstName: '', lastName: '', email: '', phone: '', specialty: '', password: '' });
      setLoadingCredentials(true);
      const { data } = await listDoctorCredentials();
      setDoctorCredentials(data);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Unable to create a doctor account.');
    } finally {
      setCreateLoading(false);
      setLoadingCredentials(false);
    }
  };

  const openDeactivateConfirmation = (doctor) => {
    setPendingDeactivate(doctor);
    setDeleteConfirmOpen(true);
    setCredentialError('');
  };

  const closeDeactivateConfirmation = () => {
    setPendingDeactivate(null);
    setDeleteConfirmOpen(false);
  };

  const confirmDeactivateDoctor = async () => {
    if (!pendingDeactivate) return;

    setDeleteConfirmOpen(false);
    setDeletingDoctorId(pendingDeactivate.id);
    setCredentialError('');

    try {
      await deleteDoctor(pendingDeactivate.id);
      setLoadingCredentials(true);
      const { data } = await listDoctorCredentials();
      setDoctorCredentials(data);
    } catch (err) {
      setCredentialError(err.response?.data?.message || 'Unable to deactivate doctor account.');
    } finally {
      setPendingDeactivate(null);
      setDeletingDoctorId(null);
      setLoadingCredentials(false);
    }
  };

  const handleRestoreDoctor = async (doctorId) => {
    setRestoringDoctorId(doctorId);
    setCredentialError('');

    try {
      await restoreDoctor(doctorId);
      setLoadingCredentials(true);
      const { data } = await listDoctorCredentials();
      setDoctorCredentials(data);
    } catch (err) {
      setCredentialError(err.response?.data?.message || 'Unable to restore doctor account.');
    } finally {
      setRestoringDoctorId(null);
      setLoadingCredentials(false);
    }
  };

  const openRestoreAllConfirmation = () => {
    setRestoreAllConfirmOpen(true);
    setCredentialError('');
  };

  const closeRestoreAllConfirmation = () => {
    setRestoreAllConfirmOpen(false);
  };

  const confirmRestoreAllInactiveDoctors = async () => {
    setRestoreAllConfirmOpen(false);
    setRestoringAll(true);
    setCredentialError('');

    try {
      await restoreAllInactiveDoctors();
      setLoadingCredentials(true);
      const { data } = await listDoctorCredentials();
      setDoctorCredentials(data);
      setStatusFilter('all');
    } catch (err) {
      setCredentialError(err.response?.data?.message || 'Unable to restore inactive doctor accounts.');
    } finally {
      setRestoringAll(false);
      setLoadingCredentials(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.role === 'admin') {
    return (
      <div className="auth-page">
        <div className="auth-header">
          <div className="auth-brand">
            <span className="auth-brand-mark">✚</span>
            <div>
              <div className="page-eyebrow">TERRALINK Health</div>
              <h2 className="auth-header-title">Admin dashboard</h2>
            </div>
          </div>
          <div className="auth-header-actions">
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>

        <div className="auth-layout auth-layout-wide">
          <section className="auth-panel auth-panel-featured auth-hero-panel">
            <div className="auth-hero-badges">
              <span className="badge badge-confirmed">Admin access</span>
              <span className="badge badge-completed">Doctor credentials</span>
            </div>
            <div className="page-eyebrow auth-pretitle">Admin workspace</div>
            <h1 className="auth-title">Doctor login credentials</h1>
            <p className="auth-copy">
              View login details for all doctor accounts, including seeded credentials. All seeded doctor accounts use the default password <strong>ChangeMe123!</strong> until the password is changed.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
              <span className="badge badge-completed">Total doctors: {totalDoctorAccounts}</span>
              <span className="badge badge-confirmed">Active: {activeDoctorCount}</span>
              <span className="badge badge-warning">Inactive: {inactiveDoctorCount}</span>
              <span className="badge badge-confirmed">Seeded default passwords: {seededDefaultCredentials}</span>
            </div>
          </section>

          <section className="auth-panel auth-card auth-card-form" style={{ marginTop: 24 }}>
            <div className="auth-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div className="page-eyebrow">Inactive doctor report</div>
                <h2>Inactive doctor accounts</h2>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn-secondary" type="button" onClick={() => setStatusFilter('inactive')}>
                  Show inactive doctors
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={inactiveDoctorCount === 0 || restoringAll}
                  onClick={openRestoreAllConfirmation}
                >
                  {restoringAll ? 'Restoring all…' : 'Restore all inactive'}
                </button>
              </div>
            </div>
            <div className="auth-card-body" style={{ padding: '1rem 0' }}>
              <p style={{ margin: 0 }}>
                There are <strong>{inactiveDoctorCount}</strong> inactive doctor account{inactiveDoctorCount === 1 ? '' : 's'}.
                Deactivated accounts remain here for history and can be restored when needed.
              </p>
            </div>
          </section>

          <section className="auth-panel auth-card auth-card-form">
            <div className="auth-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div className="page-eyebrow">Doctor accounts</div>
                <h2>All doctors</h2>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ minWidth: 160 }}
                >
                  <option value="all">All doctors</option>
                  <option value="active">Active doctors</option>
                  <option value="inactive">Inactive doctors</option>
                </select>
                <button className="btn btn-primary" type="button" onClick={handleCreateOpen}>
                  Add doctor
                </button>
              </div>
            </div>
            {loadingCredentials ? (
              <p>Loading doctor credentials…</p>
            ) : credentialError ? (
              <div className="alert alert-error">{credentialError}</div>
            ) : (
              <>
                {doctorCredentials.length === 0 ? (
                  <div className="alert alert-info">No doctor accounts found.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Specialty</th>
                          <th>Phone</th>
                          <th>Created</th>
                          <th>Status</th>
                          <th>Login password</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctorCredentials.map((doctor) => (
                          <tr key={doctor.id}>
                            <td>{doctor.fullName || 'Unknown'}</td>
                            <td>{doctor.email}</td>
                            <td>{doctor.specialty}</td>
                            <td>{doctor.phone || '—'}</td>
                            <td>{doctor.createdAt ? dateFormatter.format(new Date(doctor.createdAt)) : '—'}</td>
                            <td>{doctor.isActive ? 'Active' : 'Inactive'}</td>
                            <td>{doctor.loginPassword}</td>
                            <td>
                              {doctor.isActive ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  disabled={deletingDoctorId === doctor.id}
                                  onClick={() => openDeactivateConfirmation(doctor)}
                                >
                                  {deletingDoctorId === doctor.id ? 'Deactivating…' : 'Deactivate'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  disabled={restoringDoctorId === doctor.id}
                                  onClick={() => handleRestoreDoctor(doctor.id)}
                                >
                                  {restoringDoctorId === doctor.id ? 'Restoring…' : 'Restore'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            <p style={{ marginTop: 16, fontSize: '0.88rem' }}>
              <Link to="/">Back to home</Link>
            </p>
          </section>
          <Modal open={createOpen} title="Create doctor account" onClose={handleCreateClose}>
            <form onSubmit={handleCreateDoctor}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="doctor-first-name">First name</label>
                  <input
                    id="doctor-first-name"
                    name="firstName"
                    value={createForm.firstName}
                    onChange={handleCreateChange}
                    required
                  />
                  {createFormErrors.firstName && <div className="field-error">{createFormErrors.firstName}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="doctor-last-name">Last name</label>
                  <input
                    id="doctor-last-name"
                    name="lastName"
                    value={createForm.lastName}
                    onChange={handleCreateChange}
                    required
                  />
                  {createFormErrors.lastName && <div className="field-error">{createFormErrors.lastName}</div>}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="doctor-email">Email</label>
                <input
                  id="doctor-email"
                  name="email"
                  type="email"
                  value={createForm.email}
                  onChange={handleCreateChange}
                  required
                />
                {createFormErrors.email && <div className="field-error">{createFormErrors.email}</div>}
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="doctor-phone">Phone</label>
                  <input
                    id="doctor-phone"
                    name="phone"
                    value={createForm.phone}
                    onChange={handleCreateChange}
                    required
                  />
                  {createFormErrors.phone && <div className="field-error">{createFormErrors.phone}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="doctor-specialty">Specialty</label>
                  <input
                    id="doctor-specialty"
                    name="specialty"
                    value={createForm.specialty}
                    onChange={handleCreateChange}
                    required
                  />
                  {createFormErrors.specialty && <div className="field-error">{createFormErrors.specialty}</div>}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="doctor-password">Password</label>
                <input
                  id="doctor-password"
                  name="password"
                  type="password"
                  value={createForm.password}
                  onChange={handleCreateChange}
                  required
                  minLength={8}
                />
                {createFormErrors.password && <div className="field-error">{createFormErrors.password}</div>}
              </div>
              {createError && <div className="alert alert-error">{createError}</div>}
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={handleCreateClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create doctor'}
                </button>
              </div>
            </form>
          </Modal>
          <Modal open={deleteConfirmOpen} title="Confirm deactivation" onClose={closeDeactivateConfirmation}>
            <p>
              Deactivate doctor account <strong>{pendingDeactivate?.fullName || 'this account'}</strong>?
              The record will remain for history, and the doctor will no longer be able to sign in.
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={closeDeactivateConfirmation}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDeactivateDoctor}>
                Confirm deactivate
              </button>
            </div>
          </Modal>
          <Modal open={restoreAllConfirmOpen} title="Confirm restore all" onClose={closeRestoreAllConfirmation}>
            <p>
              Restore all inactive doctor accounts? This will reactivate {inactiveDoctorCount} account{inactiveDoctorCount === 1 ? '' : 's'} and return them to active status.
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={closeRestoreAllConfirmation}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmRestoreAllInactiveDoctors}>
                Confirm restore all
              </button>
            </div>
          </Modal>
        </div>
      </div>
    );
  }

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
