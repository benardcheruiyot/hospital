import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getDoctorAvailability,
  getDoctorAvailableSlots,
  listDoctors,
  listSpecialties,
} from '../services/doctorApi.js';
import {
  cancelAppointment,
  checkInAppointment,
  createAppointment,
  listAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
} from '../services/appointmentApi.js';
import useCountUp from '../hooks/useCountUp.js';
import { getMyPatientProfile } from '../services/patientApi.js';

const canSelfManage = (appointment) =>
  ['scheduled', 'confirmed'].includes(appointment.status) &&
  new Date(appointment.scheduledAt).getTime() > Date.now();

const EMPTY_FORM = {
  doctorId: '',
  scheduledAt: '',
  type: 'in_person',
  reason: '',
};

const PATIENT_MUTATIONS = {
  'check-in': checkInAppointment,
  cancel: cancelAppointment,
  reschedule: rescheduleAppointment,
};

const PATIENT_SUCCESS_MESSAGES = {
  'check-in': 'You have been checked in for the appointment.',
  cancel: 'Appointment cancelled successfully.',
  reschedule: 'Appointment rescheduled successfully.',
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_DOCTOR_AVAILABILITY = {
  availableDays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 17,
  slotMinutes: 30,
  isActive: true,
};

function AnimatedKpiValue({ value }) {
  const numericValue = Number(value) || 0;
  const animatedValue = useCountUp(numericValue, 700);
  return <>{animatedValue}</>;
}

function ProgressBar({ value, variant = '' }) {
  return (
    <div className={`progress-track ${variant}`}>
      <span
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax="100"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialty, setSpecialty] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(
    () => localStorage.getItem('appointment-reminders-enabled') !== 'false'
  );
  const [rescheduleTimes, setRescheduleTimes] = useState({});
  const [doctorAvailability, setDoctorAvailability] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('pending');
  const [registrationLoading, setRegistrationLoading] = useState(false);

  const clearFeedback = useCallback(() => {
    setError('');
    setMessage('');
  }, []);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentsResponse, doctorsResponse, specialtiesResponse] = await Promise.all([
        listAppointments(),
        user.role === 'patient' ? listDoctors() : Promise.resolve({ data: [] }),
        user.role === 'patient' ? listSpecialties() : Promise.resolve({ data: [] }),
      ]);
      setAppointments(appointmentsResponse.data);
      setDoctors(doctorsResponse.data);
      setSpecialties(specialtiesResponse.data || []);
    } catch {
      setError('Unable to load appointment data.');
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    localStorage.setItem('appointment-reminders-enabled', String(remindersEnabled));
  }, [remindersEnabled]);

  useEffect(() => {
    if (user.role !== 'patient') return;
    setRegistrationLoading(true);
    getMyPatientProfile()
      .then(({ data }) => setRegistrationStatus(data.registrationStatus || 'incomplete'))
      .catch(() => setRegistrationStatus('incomplete'))
      .finally(() => setRegistrationLoading(false));
  }, [user.role]);

  useEffect(() => {
    if (user.role !== 'patient' || !form.doctorId) {
      setDoctorAvailability(null);
      setAvailableSlots([]);
      return;
    }

    let active = true;
    setLoadingSlots(true);
    setAvailableSlots([]);
    Promise.all([
      getDoctorAvailability(form.doctorId),
      getDoctorAvailableSlots(form.doctorId, { daysAhead: 14 }),
    ])
      .then(([availabilityResponse, slotsResponse]) => {
        if (!active) return;
        setDoctorAvailability(availabilityResponse.data || DEFAULT_DOCTOR_AVAILABILITY);
        setAvailableSlots((slotsResponse.data?.slots || []).slice(0, 8));
      })
      .catch(() => {
        if (!active) return;
        setDoctorAvailability(DEFAULT_DOCTOR_AVAILABILITY);
        setAvailableSlots([]);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [form.doctorId, user.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'doctorId' ? { scheduledAt: '' } : {}),
    }));
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (user.role === 'patient' && registrationStatus !== 'verified') {
      setError('Complete your registration profile (identity, emergency details, and consent) before booking.');
      return;
    }

    if (form.doctorId && availableSlots.length > 0) {
      const selectedSlot = availableSlots.find((slot) => slot.iso === form.scheduledAt);
      if (!selectedSlot) {
        setError('Please choose an appointment time from the available slots list.');
        return;
      }
    }

    const selectedDate = new Date(form.scheduledAt);
    if (doctorAvailability && !Number.isNaN(selectedDate.getTime())) {
      if (!doctorAvailability.isActive) {
        setError('Selected doctor is currently not available for booking.');
        return;
      }

      const day = selectedDate.getDay();
      if (!doctorAvailability.availableDays.includes(day)) {
        setError('Selected day is outside doctor availability. Please choose another day.');
        return;
      }

      const minutes = selectedDate.getHours() * 60 + selectedDate.getMinutes();
      const startMinutes = doctorAvailability.startHour * 60;
      const endMinutes = doctorAvailability.endHour * 60;
      if (minutes < startMinutes || minutes >= endMinutes) {
        setError('Selected time is outside doctor working hours.');
        return;
      }

      if ((minutes - startMinutes) % doctorAvailability.slotMinutes !== 0) {
        setError(`Pick a time aligned to ${doctorAvailability.slotMinutes}-minute intervals.`);
        return;
      }
    }

    try {
      await createAppointment(form);
      setMessage('Appointment scheduled successfully.');
      setForm(EMPTY_FORM);
      setDoctorAvailability(null);
      loadPageData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to schedule appointment.');
    }
  };

  const handleStatusChange = async (id, status) => {
    clearFeedback();
    try {
      await updateAppointmentStatus(id, status);
      loadPageData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update appointment status.');
    }
  };

  const handlePatientAction = async (action, id, scheduledAt) => {
    clearFeedback();

    try {
      const mutate = PATIENT_MUTATIONS[action];
      if (!mutate) return;

      if (action === 'reschedule') {
        await mutate(id, scheduledAt);
      } else {
        await mutate(id);
      }

      setMessage(PATIENT_SUCCESS_MESSAGES[action]);
      loadPageData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update the appointment.');
    }
  };

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
    [appointments]
  );

  const nextAppointment = useMemo(
    () => sortedAppointments.find((appt) => new Date(appt.scheduledAt).getTime() > Date.now()) || null,
    [sortedAppointments]
  );

  const visitMix = useMemo(() => {
    const total = sortedAppointments.length || 1;
    const inPerson = sortedAppointments.filter((appt) => appt.type === 'in_person').length;
    const virtual = sortedAppointments.filter((appt) => appt.type === 'telemedicine').length;
    return {
      inPerson,
      virtual,
      inPersonPct: Math.round((inPerson / total) * 100),
      virtualPct: Math.round((virtual / total) * 100),
    };
  }, [sortedAppointments]);

  const timeToNextVisit = useMemo(() => {
    if (!nextAppointment) return 'No upcoming appointment';

    const diff = new Date(nextAppointment.scheduledAt).getTime() - Date.now();
    if (diff <= 0) return 'Now';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days >= 1) return `${days} day${days === 1 ? '' : 's'} to go`;
    return `${hours} hour${hours === 1 ? '' : 's'} to go`;
  }, [nextAppointment]);

  const stats = useMemo(() => {
    const scheduled = sortedAppointments.filter((appt) => appt.status === 'scheduled').length;
    const confirmed = sortedAppointments.filter((appt) => appt.status === 'confirmed').length;
    const virtual = sortedAppointments.filter((appt) => appt.type === 'telemedicine').length;
    const nextAppointment = sortedAppointments.find((appt) => new Date(appt.scheduledAt) > new Date());
    const queueAhead = nextAppointment
      ? sortedAppointments.filter(
          (appt) =>
            new Date(appt.scheduledAt) < new Date(nextAppointment.scheduledAt) &&
            ['scheduled', 'confirmed'].includes(appt.status)
        ).length
      : 0;

    return {
      scheduled,
      confirmed,
      virtual,
      queueAhead,
      queueList: sortedAppointments
        .filter((appt) => ['scheduled', 'confirmed'].includes(appt.status))
        .map((appt, index) => ({ ...appt, queuePosition: index + 1 }))
        .slice(0, 5),
    };
  }, [sortedAppointments]);

  const filteredDoctors = useMemo(() => {
    if (!specialty) return doctors;
    return doctors.filter((d) => (d.specialty || '').toLowerCase() === specialty.toLowerCase());
  }, [doctors, specialty]);

  const hasDoctors = doctors.length > 0;
  const hasDoctorsForSelection = filteredDoctors.length > 0;

  const canSchedule =
    hasDoctorsForSelection &&
    !registrationLoading &&
    registrationStatus === 'verified' &&
    !(form.doctorId && !loadingSlots && availableSlots.length === 0);

  return (
    <AppShell>
      <section className="hero-card motion-rise">
        <div>
          <div className="page-eyebrow">Scheduling and queue management</div>
          <h2 className="section-title">Appointments</h2>
          <p className="section-copy panel-copy">
            Book visits, manage live queue visibility, receive reminder preferences, and self-service reschedule or cancel appointments without front-desk calls.
          </p>
        </div>
        <div className="hero-actions hero-summary">
          <div className="hero-metric">
            <span>Scheduled</span>
            <strong>{stats.scheduled}</strong>
          </div>
          <div className="hero-metric">
            <span>Virtual visits</span>
            <strong>{stats.virtual}</strong>
          </div>
        </div>
      </section>

      <div className="grid grid-2 appointment-twist-grid motion-rise delay-1">
        <div className="card appointment-spotlight-card">
          <div className="page-eyebrow">Care runway</div>
          <h3 className="section-subtitle">
            {nextAppointment
              ? new Date(nextAppointment.scheduledAt).toLocaleString()
              : 'No upcoming visit scheduled'}
          </h3>
          <p className="section-copy">
            {nextAppointment
              ? `${nextAppointment.type.replace('_', ' ')} with ${
                  user.role === 'doctor'
                    ? `${nextAppointment.Patient?.User?.firstName || ''} ${nextAppointment.Patient?.User?.lastName || ''}`
                    : `Dr. ${nextAppointment.Doctor?.User?.firstName || ''} ${nextAppointment.Doctor?.User?.lastName || ''}`
                }`
              : 'Use smart slot booking to create your next visit and keep your care journey moving.'}
          </p>
          <div className="appointment-spotlight-footer">
            <span>Readiness</span>
            <strong>{timeToNextVisit}</strong>
          </div>
          <div className="section-actions">
            <Button variant="primary" onClick={() => navigate('/appointments/new')}>
              Book new appointment
            </Button>
          </div>
        </div>

        <div className="card appointment-mix-card">
          <div className="page-eyebrow">Visit strategy</div>
          <h3 className="section-subtitle">In-person vs virtual mix</h3>
          <div className="appointment-mix-row">
            <span>In-person</span>
            <strong>{visitMix.inPerson}</strong>
          </div>
          <ProgressBar value={visitMix.inPersonPct} />
          <div className="appointment-mix-row">
            <span>Telemedicine</span>
            <strong>{visitMix.virtual}</strong>
          </div>
          <ProgressBar value={visitMix.virtualPct} variant="appointment-progress-virtual" />
        </div>
      </div>

      <div className="grid grid-4 motion-rise delay-2">
        <div className="card stat-card">
          <div className="kpi-value"><AnimatedKpiValue value={stats.scheduled} /></div>
          <div className="kpi-label">Awaiting visit</div>
        </div>
        <div className="card stat-card">
          <div className="kpi-value"><AnimatedKpiValue value={stats.confirmed} /></div>
          <div className="kpi-label">Confirmed</div>
        </div>
        <div className="card stat-card">
          <div className="kpi-value"><AnimatedKpiValue value={stats.virtual} /></div>
          <div className="kpi-label">Telemedicine slots</div>
        </div>
        <div className="card stat-card">
          <div className="kpi-value">
            <AnimatedKpiValue value={user.role === 'patient' ? stats.queueAhead : appointments.length} />
          </div>
          <div className="kpi-label">
            {user.role === 'patient' ? 'Estimated queue ahead' : 'Appointments loaded'}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="grid grid-2 dashboard-layout motion-rise delay-3">
        {user.role === 'patient' && (
          <form className="card page-stack" onSubmit={handleSchedule}>
            <div>
              <div className="page-eyebrow">Smart slot booking</div>
              <h3 className="section-subtitle">Schedule a new appointment</h3>
            </div>
            {!loading && !hasDoctors && (
              <div className="alert alert-error">
                No providers are available for booking yet. Create or sign in with a doctor account first,
                then return here to schedule visits.
              </div>
            )}
            {!registrationLoading && registrationStatus !== 'verified' && (
              <div className="alert alert-error">
                Your registration is <strong>{registrationStatus}</strong>. Complete the intake form in Registration before booking appointments.
              </div>
            )}
            <div className="grid grid-2">
              <div className="form-group">
                <label>Specialty</label>
                <select name="specialty" value={specialty} onChange={(e) => { setSpecialty(e.target.value); setForm((f)=>({ ...f, doctorId: '' })); }} disabled={!doctors.length}>
                  <option value="">Select a specialty...</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {specialty && (
                  <div className="form-group">
                    <label>Doctor</label>
                    <select
                      name="doctorId"
                      required
                      value={form.doctorId}
                      onChange={handleChange}
                      disabled={!hasDoctorsForSelection}
                    >
                      <option value="">Select a doctor...</option>
                      {filteredDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.User?.firstName} {doc.User?.lastName} - {doc.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {doctorAvailability && (
                  <div className="field-hint field-hint-spaced">
                    Available days:{' '}
                    {doctorAvailability.availableDays.map((day) => WEEKDAY_LABELS[day]).join(', ')}
                    {' '}
                    | Hours: {String(doctorAvailability.startHour).padStart(2, '0')}:00-
                    {String(doctorAvailability.endHour).padStart(2, '0')}:00
                    {' '}
                    | Slot: {doctorAvailability.slotMinutes} min
                  </div>
                )}
                {form.doctorId && (
                  <div className="field-hint-group">
                    <div className="field-hint field-hint-spaced">
                      Choose from available slots for this doctor
                    </div>
                    {loadingSlots ? (
                      <div className="field-hint">Finding available times...</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="field-hint">No open slots in the next 14 days. Please select another doctor or check back later.</div>
                    ) : (
                      <div className="form-group">
                        <label htmlFor="scheduled-slot">Available slot</label>
                        <select
                          id="scheduled-slot"
                          name="scheduledAt"
                          required
                          value={form.scheduledAt}
                          onChange={handleChange}
                        >
                          <option value="">Select an available time...</option>
                          {availableSlots.map((slot) => (
                            <option key={slot.iso} value={slot.iso}>
                              {new Date(slot.iso).toLocaleString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Visit type</label>
                <select name="type" value={form.type} onChange={handleChange} disabled={!hasDoctors}>
                  <option value="in_person">In-person</option>
                  <option value="telemedicine">Telemedicine (virtual)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason for visit</label>
                <input name="reason" value={form.reason} onChange={handleChange} disabled={!hasDoctors} />
              </div>
            </div>
            <button className="btn" type="submit" disabled={!canSchedule}>
              Schedule appointment
            </button>
            {!registrationLoading && registrationStatus !== 'verified' && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => navigate('/registration')}
              >
                Complete registration
              </button>
            )}
          </form>
        )}

        <div className="grid page-stack">
          <div className="card accent-card">
            <div className="page-eyebrow">Flow guidance</div>
            <h3 className="section-subtitle">
              {user.role === 'patient' ? 'Queue visibility and reminders' : 'Daily schedule control'}
            </h3>
            <p className="section-copy">
              {user.role === 'patient'
                ? 'Choose telemedicine when you need a virtual consultation, then watch your status here instead of waiting for manual updates.'
                : 'Update statuses as patients move through the queue to keep downstream reporting and telemedicine readiness accurate.'}
            </p>
            {user.role === 'patient' && (
              <label className="toggle-row toggle-row-spaced">
                <input
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  className="checkbox-inline"
                />
                <span>
                  Automated reminders {remindersEnabled ? 'enabled' : 'disabled'} for upcoming visits
                </span>
              </label>
            )}
          </div>

          {user.role === 'patient' && (
            <div className="card">
              <div className="page-eyebrow">Dynamic waitlist and queue tracker</div>
              <h3 className="section-subtitle">Live queue snapshot</h3>
              <div className="schedule-list">
                {stats.queueList.length === 0 ? (
                  <p className="section-copy">No active queue positions right now.</p>
                ) : (
                  stats.queueList.map((appt) => (
                    <div className="schedule-item" key={appt.id}>
                      <div>
                        <div className="schedule-title">Queue position {appt.queuePosition}</div>
                        <div className="schedule-meta">
                          {new Date(appt.scheduledAt).toLocaleString()} · {appt.type.replace('_', ' ')}
                        </div>
                      </div>
                      <span className={`badge badge-${appt.status}`}>{appt.status.replace('_', ' ')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="card">
            <div className="section-header">
              <div>
                <div className="page-eyebrow">Appointment ledger</div>
                <h3 className="section-subtitle">Your appointments</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading...</p>
            ) : sortedAppointments.length === 0 ? (
              <p className="section-copy">No appointments found yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date & time</th>
                    <th>{user.role === 'doctor' ? 'Patient' : 'Doctor'}</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAppointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>{new Date(appt.scheduledAt).toLocaleString()}</td>
                      <td>
                        {user.role === 'doctor'
                          ? `${appt.Patient?.User?.firstName || ''} ${appt.Patient?.User?.lastName || ''}`
                          : `Dr. ${appt.Doctor?.User?.firstName || ''} ${appt.Doctor?.User?.lastName || ''}`}
                      </td>
                      <td className="text-capitalize">{appt.type.replace('_', ' ')}</td>
                      <td>
                        <span className={`badge badge-${appt.status}`}>{appt.status.replace('_', ' ')}</span>
                      </td>
                      <td>
                        {user.role === 'doctor' ? (
                          <select
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No show</option>
                          </select>
                        ) : canSelfManage(appt) ? (
                          <div className="table-actions">
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => handlePatientAction('check-in', appt.id)}
                            >
                              Check in
                            </button>
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => handlePatientAction('cancel', appt.id)}
                            >
                              Cancel
                            </button>
                            <input
                              type="datetime-local"
                              value={rescheduleTimes[appt.id] || ''}
                              onChange={(e) =>
                                setRescheduleTimes((prev) => ({ ...prev, [appt.id]: e.target.value }))
                              }
                            />
                            <button
                              className="btn"
                              type="button"
                              onClick={() =>
                                handlePatientAction('reschedule', appt.id, rescheduleTimes[appt.id])
                              }
                              disabled={!rescheduleTimes[appt.id]}
                            >
                              Reschedule
                            </button>
                          </div>
                        ) : (
                          <span className="field-hint">No self-service action needed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
