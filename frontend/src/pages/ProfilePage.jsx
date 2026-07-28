import React, { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyPatientProfile, updateMyPatientProfile } from '../services/patientApi.js';
import {
  getMyDoctorAvailability,
  getMyDoctorProfile,
  updateMyDoctorAvailability,
  updateMyDoctorProfile,
} from '../services/doctorApi.js';

const patientEmptyForm = {
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

const doctorEmptyForm = {
  specialty: '',
  licenseNumber: '',
  department: '',
  bio: '',
  isAvailableForTelemedicine: true,
};

const WEEKDAY_OPTIONS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const doctorAvailabilityEmptyForm = {
  availableDays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 17,
  slotMinutes: 30,
  isActive: true,
};

export default function ProfilePage() {
  const { user } = useAuth();
  const editSectionRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [patientProfile, setPatientProfile] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patientForm, setPatientForm] = useState(patientEmptyForm);
  const [doctorForm, setDoctorForm] = useState(doctorEmptyForm);
  const [doctorAvailabilityForm, setDoctorAvailabilityForm] = useState(doctorAvailabilityEmptyForm);
  const [saving, setSaving] = useState(false);

  const profileTitle =
    user.role === 'patient' ? 'Patient profile' : user.role === 'doctor' ? 'Clinician profile' : 'Account profile';

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.trim() || 'HP';
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available';

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        if (user.role === 'patient') {
          const { data } = await getMyPatientProfile();
          if (!active) return;
          setPatientProfile(data);
          setPatientForm({
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender || '',
            nationalId: data.nationalId || '',
            address: data.address || '',
            emergencyContactName: data.emergencyContactName || '',
            emergencyContactPhone: data.emergencyContactPhone || '',
            bloodGroup: data.bloodGroup || '',
            allergies: data.allergies || '',
            consentGiven: Boolean(data.consentGiven),
          });
        } else if (user.role === 'doctor') {
          const [doctorResponse, availabilityResponse] = await Promise.all([
            getMyDoctorProfile(),
            getMyDoctorAvailability(),
          ]);
          const { data } = doctorResponse;
          if (!active) return;
          setDoctorProfile(data);
          setDoctorForm({
            specialty: data.specialty || '',
            licenseNumber: data.licenseNumber || '',
            department: data.department || '',
            bio: data.bio || '',
            isAvailableForTelemedicine: data.isAvailableForTelemedicine ?? true,
          });
          setDoctorAvailabilityForm({
            availableDays: availabilityResponse.data?.availableDays || doctorAvailabilityEmptyForm.availableDays,
            startHour: availabilityResponse.data?.startHour ?? doctorAvailabilityEmptyForm.startHour,
            endHour: availabilityResponse.data?.endHour ?? doctorAvailabilityEmptyForm.endHour,
            slotMinutes: availabilityResponse.data?.slotMinutes ?? doctorAvailabilityEmptyForm.slotMinutes,
            isActive: availabilityResponse.data?.isActive ?? doctorAvailabilityEmptyForm.isActive,
          });
        }
      } catch {
        if (active) {
          setError('Unable to load your profile.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user.role]);

  const profileBadges = useMemo(() => {
    if (user.role === 'patient') {
      return [
        { label: 'Phone verified', tone: 'success' },
        { label: patientForm.consentGiven ? 'Consent given' : 'Consent pending', tone: patientForm.consentGiven ? 'success' : 'warning' },
        { label: patientProfile?.registrationStatus || 'Registration pending', tone: 'neutral' },
      ];
    }

    if (user.role === 'doctor') {
      return [
        { label: doctorProfile?.licenseNumber ? 'License recorded' : 'License pending', tone: doctorProfile?.licenseNumber ? 'success' : 'warning' },
        { label: doctorForm.isAvailableForTelemedicine ? 'Telemedicine ready' : 'Telemedicine paused', tone: doctorForm.isAvailableForTelemedicine ? 'success' : 'warning' },
        { label: 'Care team profile', tone: 'neutral' },
      ];
    }

    return [
      { label: 'Secure admin access', tone: 'success' },
      { label: 'Platform oversight', tone: 'neutral' },
      { label: 'Profile only', tone: 'neutral' },
    ];
  }, [doctorForm.isAvailableForTelemedicine, doctorProfile?.licenseNumber, patientForm.consentGiven, patientProfile?.registrationStatus, user.role]);

  const profileStats = useMemo(() => {
    if (user.role === 'patient') {
      const fields = [
        patientForm.dateOfBirth,
        patientForm.gender,
        patientForm.nationalId,
        patientForm.address,
        patientForm.emergencyContactName,
        patientForm.emergencyContactPhone,
        patientForm.bloodGroup,
      ];
      const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

      return [
        { label: 'Profile completion', value: `${completion}%` },
        { label: 'Status', value: patientProfile?.registrationStatus || 'pending' },
        { label: 'Joined', value: joinedDate },
      ];
    }

    if (user.role === 'doctor') {
      const fields = [doctorForm.specialty, doctorForm.licenseNumber, doctorForm.department, doctorForm.bio];
      const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

      return [
        { label: 'Profile completion', value: `${completion}%` },
        { label: 'Availability', value: doctorForm.isAvailableForTelemedicine ? 'Enabled' : 'Paused' },
        { label: 'Joined', value: joinedDate },
      ];
    }

    return [
      { label: 'Access level', value: 'Platform-wide' },
      { label: 'Joined', value: joinedDate },
      { label: 'Profile type', value: 'Account only' },
    ];
  }, [doctorForm.bio, doctorForm.department, doctorForm.isAvailableForTelemedicine, doctorForm.licenseNumber, doctorForm.specialty, joinedDate, patientForm.address, patientForm.bloodGroup, patientForm.dateOfBirth, patientForm.emergencyContactName, patientForm.emergencyContactPhone, patientForm.gender, patientForm.nationalId, patientProfile?.registrationStatus, user.role]);

  const handleEditProfile = () => {
    editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setMessage('Profile link copied to clipboard.');
    } catch {
      setMessage(`Profile link: ${profileUrl}`);
    }
  };

  const handleViewMore = () => {
    editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePatientChange = (event) => {
    const { name, value, type, checked } = event.target;
    setPatientForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDoctorChange = (event) => {
    const { name, value, type, checked } = event.target;
    setDoctorForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAvailabilityChange = (event) => {
    const { name, value, type, checked } = event.target;
    setDoctorAvailabilityForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value),
    }));
  };

  const toggleAvailabilityDay = (day) => {
    setDoctorAvailabilityForm((prev) => {
      const hasDay = prev.availableDays.includes(day);
      const availableDays = hasDay
        ? prev.availableDays.filter((item) => item !== day)
        : [...prev.availableDays, day].sort((a, b) => a - b);

      return {
        ...prev,
        availableDays,
      };
    });
  };

  const handlePatientSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await updateMyPatientProfile(patientForm);
      setPatientProfile(data);
      setMessage('Your patient profile was updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your patient profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDoctorSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    if (doctorAvailabilityForm.availableDays.length === 0) {
      setSaving(false);
      setError('Select at least one available day for patient scheduling.');
      return;
    }

    try {
      const [profileResponse, availabilityResponse] = await Promise.all([
        updateMyDoctorProfile(doctorForm),
        updateMyDoctorAvailability(doctorAvailabilityForm),
      ]);
      const { data } = profileResponse;
      setDoctorProfile(data);
      setDoctorAvailabilityForm({
        availableDays: availabilityResponse.data.availableDays,
        startHour: availabilityResponse.data.startHour,
        endHour: availabilityResponse.data.endHour,
        slotMinutes: availabilityResponse.data.slotMinutes,
        isActive: availabilityResponse.data.isActive,
      });
      setMessage('Your doctor profile was updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your doctor profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <section className="hero-card">
        <div className="profile-hero-left">
          <div className="profile-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-hero-copy">
            <div className="page-eyebrow">Personal profile</div>
            <h2 style={{ margin: '6px 0 8px' }}>
              {user.firstName} {user.lastName}
            </h2>
            <div className="profile-status-row">
              <span className="profile-status-dot" />
              <strong>Active</strong>
              <span className="profile-role-chip">{profileTitle}</span>
            </div>
            <div className="profile-proof-row">
              {user.role === 'patient' ? (
                <>
                  <span className="profile-proof-item">Phone verified</span>
                  <span className="profile-proof-item">ID verified</span>
                </>
              ) : user.role === 'doctor' ? (
                <>
                  <span className="profile-proof-item">License on file</span>
                  <span className="profile-proof-item">Telemedicine ready</span>
                </>
              ) : (
                <>
                  <span className="profile-proof-item">Platform access</span>
                  <span className="profile-proof-item">Security enabled</span>
                </>
              )}
            </div>
            <p className="section-copy" style={{ maxWidth: 720, marginBottom: 0 }}>
              Review your account details, role-specific profile information, and the data the platform uses to coordinate your care.
            </p>
          </div>
        </div>
        <div className="profile-hero-actions">
          <button className="btn" type="button" onClick={handleEditProfile}>
            Edit profile
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleShareProfile}>
            Share profile
          </button>
          <div className="profile-chip-row">
            {profileBadges.map((badge) => (
              <span key={badge.label} className={`profile-badge profile-badge-${badge.tone}`}>
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card loading-panel">
          <div className="status-spinner" />
          <h3 style={{ margin: 0 }}>Loading profile</h3>
          <p className="section-copy" style={{ margin: 0 }}>
            Preparing your account and care details.
          </p>
        </div>
      ) : (
        <>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="profile-tabs">
            <span className="profile-tab active">Profile</span>
            <span className="profile-tab">Care statistics</span>
          </div>

          <div className="card profile-stat-card" style={{ marginBottom: 16 }}>
            <div className="section-header">
              <div>
                <div className="page-eyebrow">Profile</div>
                <h3 style={{ margin: '4px 0 0' }}>{user.role === 'patient' ? 'Patient profile summary' : user.role === 'doctor' ? 'Clinician profile summary' : 'Account summary'}</h3>
              </div>
              <span className="badge badge-confirmed">View more</span>
            </div>
            <div className="profile-stat-list">
              {profileStats.map((item) => (
                <div className="profile-stat-row" key={item.label}>
                  <span className="profile-stat-label">{item.label}</span>
                  <strong className="profile-stat-value">{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="profile-view-more-wrap">
              <button className="btn btn-secondary profile-view-more" type="button" onClick={handleViewMore}>
                View more
              </button>
            </div>
          </div>

          <div className="grid grid-2 dashboard-layout">
            <div className="card profile-side-card">
              <div className="page-eyebrow">Account details</div>
              <h3 style={{ marginTop: 4 }}>Identity and login</h3>
              <div className="info-list compact-list">
                <div className="info-row">
                  <strong>Full name</strong>
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Email</strong>
                  <span>{user.email}</span>
                </div>
                <div className="info-row">
                  <strong>Phone</strong>
                  <span>{user.phone || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <strong>Role</strong>
                  <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                </div>
              </div>
            </div>

            {user.role === 'patient' ? (
              <form className="card page-stack" onSubmit={handlePatientSave}>
                <div ref={editSectionRef} />
                <div className="page-eyebrow">Patient profile</div>
                <h3 style={{ marginTop: 4 }}>Intake details</h3>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>Date of birth</label>
                    <input type="date" name="dateOfBirth" value={patientForm.dateOfBirth} onChange={handlePatientChange} />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" value={patientForm.gender} onChange={handlePatientChange}>
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>National ID</label>
                    <input name="nationalId" value={patientForm.nationalId} onChange={handlePatientChange} />
                  </div>
                  <div className="form-group">
                    <label>Blood group</label>
                    <input name="bloodGroup" value={patientForm.bloodGroup} onChange={handlePatientChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" value={patientForm.address} onChange={handlePatientChange} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>Emergency contact name</label>
                    <input
                      name="emergencyContactName"
                      value={patientForm.emergencyContactName}
                      onChange={handlePatientChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Emergency contact phone</label>
                    <input
                      name="emergencyContactPhone"
                      value={patientForm.emergencyContactPhone}
                      onChange={handlePatientChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Allergies</label>
                  <textarea rows={3} name="allergies" value={patientForm.allergies} onChange={handlePatientChange} />
                </div>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    name="consentGiven"
                    checked={patientForm.consentGiven}
                    onChange={handlePatientChange}
                    style={{ width: 'auto' }}
                  />
                  <span>Consent to care coordination and digital record handling</span>
                </label>
                <div className="profile-form-actions">
                  <button className="btn" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save profile'}
                  </button>
                </div>
              </form>
            ) : user.role === 'doctor' ? (
              <form className="card page-stack" onSubmit={handleDoctorSave}>
                <div ref={editSectionRef} />
                <div className="page-eyebrow">Doctor profile</div>
                <h3 style={{ marginTop: 4 }}>Professional details</h3>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>Specialty</label>
                    <input name="specialty" value={doctorForm.specialty} onChange={handleDoctorChange} />
                  </div>
                  <div className="form-group">
                    <label>License number</label>
                    <input name="licenseNumber" value={doctorForm.licenseNumber} onChange={handleDoctorChange} />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>Department</label>
                    <input name="department" value={doctorForm.department} onChange={handleDoctorChange} />
                  </div>
                  <label className="toggle-row" style={{ alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      name="isAvailableForTelemedicine"
                      checked={doctorForm.isAvailableForTelemedicine}
                      onChange={handleDoctorChange}
                      style={{ width: 'auto' }}
                    />
                    <span>Available for telemedicine</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea rows={5} name="bio" value={doctorForm.bio} onChange={handleDoctorChange} />
                </div>
                <div className="card" style={{ background: 'rgba(15, 110, 110, 0.06)' }}>
                  <div className="page-eyebrow">Scheduling availability</div>
                  <h4 style={{ margin: '4px 0 10px' }}>Patient booking windows</h4>
                  <div className="form-group">
                    <label>Available days</label>
                    <div className="table-actions">
                      {WEEKDAY_OPTIONS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          className={
                            doctorAvailabilityForm.availableDays.includes(day.value)
                              ? 'btn'
                              : 'btn btn-secondary'
                          }
                          onClick={() => toggleAvailabilityDay(day.value)}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-3">
                    <div className="form-group">
                      <label>Start hour</label>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        name="startHour"
                        value={doctorAvailabilityForm.startHour}
                        onChange={handleAvailabilityChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>End hour</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        name="endHour"
                        value={doctorAvailabilityForm.endHour}
                        onChange={handleAvailabilityChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Slot minutes</label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        max={180}
                        name="slotMinutes"
                        value={doctorAvailabilityForm.slotMinutes}
                        onChange={handleAvailabilityChange}
                      />
                    </div>
                  </div>
                  <label className="toggle-row" style={{ alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={doctorAvailabilityForm.isActive}
                      onChange={handleAvailabilityChange}
                      style={{ width: 'auto' }}
                    />
                    <span>Allow new patient bookings on this schedule</span>
                  </label>
                </div>
                <div className="profile-form-actions">
                  <button className="btn" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save profile'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="card accent-card page-stack">
                <div ref={editSectionRef} />
                <div className="page-eyebrow">Admin profile</div>
                <h3 style={{ marginTop: 4 }}>Platform oversight account</h3>
                <p className="section-copy">
                  Admin accounts use the shared user profile plus platform-wide access controls. This page gives every user role a consistent profile entry point.
                </p>
                <div className="info-list compact-list">
                  <div className="info-row">
                    <strong>Access level</strong>
                    <span>Hospital operations and configuration oversight</span>
                  </div>
                  <div className="info-row">
                    <strong>Profile editing</strong>
                    <span>Account updates can be added here later if needed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
