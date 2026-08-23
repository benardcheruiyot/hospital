import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import Modal from '../components/Modal.jsx';
import { listPatients } from '../services/patientApi.js';
import { createDoctor } from '../services/doctorApi.js';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    specialty: '',
  });
  const [createFormErrors, setCreateFormErrors] = useState({});

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await listPatients(filter ? { status: filter } : {});
      setPatients(data);
    } catch {
      setError('Unable to load patients.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient) => {
      const name = `${patient.User?.firstName || ''} ${patient.User?.lastName || ''}`.toLowerCase();
      const email = (patient.User?.email || '').toLowerCase();
      const phone = (patient.User?.phone || '').toLowerCase();
      return name.includes(term) || email.includes(term) || phone.includes(term);
    });
  }, [patients, search]);

  const navigate = useNavigate();

  const handleOpenCreate = () => {
    setCreateError('');
    setSuccessMessage('');
    setCreateForm({ firstName: '', lastName: '', email: '', phone: '', password: '', specialty: '' });
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
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
    if (!createForm.password) {
      errors.password = 'Password is required.';
    } else if (createForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (!createForm.phone.trim()) {
      errors.phone = 'Phone is required.';
    } else if (!/^\+?[0-9]{7,15}$/.test(createForm.phone.trim())) {
      errors.phone = 'Enter a valid phone number.';
    }
    if (!createForm.specialty.trim()) errors.specialty = 'Specialty is required.';

    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDoctor = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!validateCreateForm()) {
      return;
    }

    setCreateLoading(true);
    try {
      await createDoctor(createForm);
      setSuccessMessage('Doctor account created successfully.');
      setCreateOpen(false);
      loadPatients();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create doctor account.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAttend = (patient) => {
    const name = encodeURIComponent(`${patient.User?.firstName || ''} ${patient.User?.lastName || ''}`);
    navigate(`/provider/consultation?patient=${name}&id=${patient.id}`);
  };

  const stats = useMemo(() => {
    const pending = patients.filter((patient) => patient.registrationStatus === 'pending').length;
    const verified = patients.filter((patient) => patient.registrationStatus === 'verified').length;
    const incomplete = patients.filter((patient) => patient.registrationStatus === 'incomplete').length;
    return { pending, verified, incomplete };
  }, [patients]);

  return (
    <AppShell>
      <section className="hero-card">
        <div>
          <div className="page-eyebrow">Registration operations</div>
          <h1 style={{ margin: '4px 0 10px' }}>Registered Patients</h1>
          <p className="section-copy" style={{ maxWidth: 720 }}>
            Monitor intake readiness, profile verification, and contact data quality across the patient population from one modern operations view.
          </p>
        </div>
        <div className="hero-actions hero-summary">
          <div className="hero-metric">
            <span>Total profiles</span>
            <strong>{patients.length}</strong>
          </div>
          <div className="hero-metric">
            <span>Verified</span>
            <strong>{stats.verified}</strong>
          </div>
          <button className="btn btn-primary" type="button" onClick={handleOpenCreate}>
            Add doctor / staff account
          </button>
        </div>
      </section>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <Modal open={createOpen} title="Create doctor account" onClose={handleCloseCreate}>
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
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseCreate}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create doctor account'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card stat-card">
          <div className="kpi-value">{stats.pending}</div>
          <div className="kpi-label">Pending verification</div>
        </div>
        <div className="card stat-card">
          <div className="kpi-value">{stats.verified}</div>
          <div className="kpi-label">Verified profiles</div>
        </div>
        <div className="card stat-card">
          <div className="kpi-value">{stats.incomplete}</div>
          <div className="kpi-label">Incomplete records</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="page-eyebrow">Directory controls</div>
            <h3 style={{ margin: '4px 0 0' }}>Patient roster</h3>
          </div>
          <div className="table-actions">
            <input
              placeholder="Search patient, email, or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
        </div>
        {/* Card roster (visual) */}
        {!loading && filteredPatients.length > 0 && (
          <div className="patient-list-grid" style={{ marginTop: 14 }}>
            {filteredPatients.slice(0, 12).map((p) => (
              <article className="patient-card" key={p.id}>
                <div className="patient-card-left">
                  <div className="patient-initial">
                    {((p.User?.firstName || '').charAt(0) || '-') + ((p.User?.lastName || '').charAt(0) || '')}
                  </div>
                  <div>
                    <div className="patient-card-name">{p.User?.firstName} {p.User?.lastName}</div>
                    <div className="patient-card-meta">{p.age ? `${p.age}y · ` : ''}{p.gender ? `${p.gender} · ` : ''}{p.reason || p.chiefComplaint || '—'}</div>
                  </div>
                </div>
                <div className="patient-card-right">
                  <div className={`patient-status patient-status-${(p.status || p.queueStatus || p.registrationStatus || 'unknown')}`}>
                    {p.status || p.queueStatus || p.registrationStatus || 'Unknown'}
                  </div>
                  <button className="btn btn-secondary" onClick={() => handleAttend(p)}>Attend</button>
                </div>
              </article>
            ))}
          </div>
        )}
        {loading ? (
          <div className="loading-panel">
            <div className="status-spinner" />
            <p className="section-copy" style={{ margin: 0 }}>
              Loading patient records...
            </p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Emergency contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.User?.firstName} {p.User?.lastName}
                    </td>
                    <td>{p.User?.email}</td>
                    <td>{p.User?.phone || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.gender || '—'}</td>
                    <td>
                      <div>{p.emergencyContactName || '—'}</div>
                      <div className="schedule-meta">{p.emergencyContactPhone || 'No phone recorded'}</div>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          p.registrationStatus === 'verified' ? 'completed' : 'scheduled'
                        }`}
                      >
                        {p.registrationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatients.length === 0 && (
              <p style={{ color: 'var(--color-muted)' }}>No patients found.</p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
