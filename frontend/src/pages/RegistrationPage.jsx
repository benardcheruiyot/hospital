import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyPatientProfile, updateMyPatientProfile } from '../services/patientApi.js';

const emptyForm = {
  dateOfBirth: '',
  gender: '',
  nationalId: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  bloodGroup: '',
  allergies: '',
  consentGiven: false,
};

export default function RegistrationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [extras, setExtras] = useState({
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceCardDataUrl: '',
    insuranceCardName: '',
  });

  const storageKey = `registration-extras:${user.id}`;

  useEffect(() => {
    getMyPatientProfile()
      .then(({ data }) => {
        setForm({
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          nationalId: data.nationalId || '',
          address: data.address || '',
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContactPhone || '',
          bloodGroup: data.bloodGroup || '',
          allergies: data.allergies || '',
          consentGiven: data.consentGiven || false,
        });
        setStatus(data.registrationStatus);

        const savedExtras = localStorage.getItem(storageKey);
        if (savedExtras) {
          try {
            setExtras(JSON.parse(savedExtras));
          } catch {
            localStorage.removeItem(storageKey);
          }
        }
      })
      .catch(() => setError('Unable to load your registration profile.'))
      .finally(() => setLoading(false));
  }, [storageKey]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const { data } = await updateMyPatientProfile(form);
      setStatus(data.registrationStatus);
      localStorage.setItem(storageKey, JSON.stringify(extras));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your details.');
    }
  };

  const handleExtraChange = (e) => {
    const { name, value } = e.target;
    setExtras((prev) => ({ ...prev, [name]: value }));
  };

  const handleInsuranceCardUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setExtras((prev) => ({
        ...prev,
        insuranceCardDataUrl: reader.result,
        insuranceCardName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const completionSteps = [
    Boolean(form.dateOfBirth && form.gender),
    Boolean(form.nationalId && form.address),
    Boolean(form.emergencyContactName && form.emergencyContactPhone),
    Boolean(form.bloodGroup || form.allergies),
    Boolean(form.consentGiven),
  ];
  const completedSteps = completionSteps.filter(Boolean).length;
  const progress = Math.round((completedSteps / completionSteps.length) * 100);
  const verificationReady = Boolean(
    form.dateOfBirth &&
      form.nationalId &&
      form.address &&
      form.emergencyContactName &&
      form.emergencyContactPhone &&
      form.consentGiven
  );
  const qrValue = useMemo(
    () =>
      JSON.stringify({
        userId: user.id,
        patient: `${user.firstName} ${user.lastName}`,
        nationalId: form.nationalId,
        status,
      }),
    [form.nationalId, status, user.firstName, user.id, user.lastName]
  );

  if (loading) {
    return (
      <AppShell>
        <div className="card loading-panel">
          <div className="status-spinner" />
          <h3 style={{ margin: 0 }}>Loading your intake form</h3>
          <p className="section-copy" style={{ margin: 0 }}>
            Preparing your profile, consent, and check-in details.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="hero-card">
        <div>
          <div className="page-eyebrow">Intake and identity</div>
          <h2 style={{ margin: '4px 0 10px' }}>Patient Registration & Intake</h2>
          <p className="section-copy" style={{ maxWidth: 720 }}>
            This page acts as the digital front desk. Complete your identity, emergency, and consent details before arrival so staff can verify your record and reduce check-in delays.
          </p>
        </div>
        <div className="hero-actions hero-summary">
          <div className="hero-metric">
            <span>Profile completion</span>
            <strong>{progress}%</strong>
          </div>
          <div className="hero-metric">
            <span>Verification status</span>
            <strong style={{ textTransform: 'capitalize' }}>{status}</strong>
          </div>
        </div>
      </section>

      <div className="grid grid-3">
        <div className="card stat-card">
          <div className="kpi-value">{completedSteps}/5</div>
          <div className="kpi-label">Required sections completed</div>
        </div>
        <div className="card stat-card">
          <div className="kpi-value">QR</div>
          <div className="kpi-label">Ready for instant check-in once verified</div>
        </div>
        <div className="card stat-card">
          <div className="kpi-value">e-Consent</div>
          <div className="kpi-label">Digital acknowledgment stored with your record</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-header">
          <div>
            <div className="page-eyebrow">Completion progress</div>
            <h3 style={{ margin: '4px 0 0' }}>Intake readiness</h3>
          </div>
          <span className="badge badge-confirmed">{progress}% complete</span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-2 dashboard-layout">
        <form className="card page-stack" onSubmit={handleSubmit}>
          <div>
            <div className="page-eyebrow">Core identity</div>
            <h3 style={{ marginTop: 4 }}>Patient profile</h3>
          </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Date of birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth || ''}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={form.gender || ''} onChange={handleChange}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div>
          <div className="page-eyebrow">Clinical intake</div>
          <h3 style={{ marginTop: 4 }}>Health and emergency details</h3>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>National ID</label>
            <input name="nationalId" value={form.nationalId} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Blood group</label>
            <input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Home address</label>
          <input name="address" value={form.address} onChange={handleChange} />
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>Emergency contact name</label>
            <input
              name="emergencyContactName"
              value={form.emergencyContactName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Emergency contact phone</label>
            <input
              name="emergencyContactPhone"
              value={form.emergencyContactPhone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Known allergies</label>
          <textarea name="allergies" rows={3} value={form.allergies} onChange={handleChange} />
        </div>

        <div>
          <div className="page-eyebrow">Documents and coverage</div>
          <h3 style={{ marginTop: 4 }}>Digital consent and documents</h3>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>Insurance provider</label>
            <input
              name="insuranceProvider"
              value={extras.insuranceProvider}
              onChange={handleExtraChange}
            />
          </div>
          <div className="form-group">
            <label>Policy number</label>
            <input
              name="insurancePolicyNumber"
              value={extras.insurancePolicyNumber}
              onChange={handleExtraChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Insurance card or supporting document</label>
          <input type="file" accept="image/*,.pdf" onChange={handleInsuranceCardUpload} />
          {extras.insuranceCardName && (
            <span className="field-hint">Uploaded: {extras.insuranceCardName}</span>
          )}
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            name="consentGiven"
            id="consentGiven"
            checked={form.consentGiven}
            onChange={handleChange}
            style={{ width: 'auto' }}
          />
          <label htmlFor="consentGiven" style={{ margin: 0 }}>
            I consent to the collection and processing of my health data for care coordination.
          </label>
        </div>

        <button className="btn" type="submit">
          Save registration details
        </button>
        </form>

        <div className="grid page-stack">
          <div className="card">
            <div className="page-eyebrow">Verification checklist</div>
            <h3 style={{ marginTop: 4 }}>What staff will confirm</h3>
            <div className="info-list">
              <div className="info-row">
                <strong>Identity integrity</strong>
                <span>National ID and demographic details are matched to your patient record.</span>
              </div>
              <div className="info-row">
                <strong>Emergency readiness</strong>
                <span>Contact details, allergies, and blood group support faster clinical response.</span>
              </div>
              <div className="info-row">
                <strong>Consent compliance</strong>
                <span>Digital consent replaces paper forms and speeds front-desk processing.</span>
              </div>
            </div>
          </div>

          <div className="card accent-card">
            <div className="page-eyebrow">Arrival experience</div>
            <h3 style={{ marginTop: 4 }}>Fast-track check-in</h3>
            <p className="section-copy">
              Once your status is verified, the hospital can issue a QR-based instant check-in flow using the details you completed here.
            </p>
            <div className={`badge badge-${status === 'verified' ? 'completed' : 'scheduled'}`}>
              {status === 'verified' ? 'Verification complete' : 'Awaiting verification'}
            </div>
            <div className="qr-card">
              <QRCodeSVG value={qrValue} size={136} bgColor="#ffffff" fgColor="#093f43" />
              <div>
                <strong>Check-in QR</strong>
                <p className="section-copy">
                  Present this at the front desk or kiosk for instant check-in after verification.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="page-eyebrow">Profile verification</div>
            <h3 style={{ marginTop: 4 }}>Readiness snapshot</h3>
            <div className="info-list compact-list">
              <div className="info-row">
                <strong>Identity data</strong>
                <span>{form.nationalId ? 'Complete' : 'National ID still missing'}</span>
              </div>
              <div className="info-row">
                <strong>Insurance documents</strong>
                <span>
                  {extras.insuranceCardName
                    ? `Uploaded ${extras.insuranceCardName}`
                    : 'Upload insurance or supporting documents'}
                </span>
              </div>
              <div className="info-row">
                <strong>Verification gate</strong>
                <span>{verificationReady ? 'Ready for verification' : 'Complete all required intake fields'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
