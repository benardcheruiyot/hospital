import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { checkInAppointment, listAppointments } from '../services/appointmentApi.js';
import { getOverview } from '../services/analyticsApi.js';
import { listTelemedicineSessions } from '../services/telemedicineApi.js';
import { parseAppointmentNotes } from '../utils/contentParsers.js';
import useCountUp from '../hooks/useCountUp.js';

const PATIENT_MODULES = [
  {
    title: 'Registration',
    detail: 'Update intake details, consent, emergency contacts, and verification before your visit.',
    to: '/registration',
    tone: 'accent',
  },
  {
    title: 'Appointments',
    detail: 'Review upcoming visits, check in, and keep track of your schedule in one place.',
    to: '/appointments',
    tone: 'neutral',
  },
  {
    title: 'Support messages',
    detail: 'Ask questions in the patient support thread and receive automatic or staff replies.',
    to: '/messages',
    tone: 'neutral',
  },
];

const PROVIDER_MODULES = [
  {
    title: 'Appointments',
    detail: 'Track the clinic schedule, arrival flow, and visit completion status.',
    to: '/appointments',
    tone: 'accent',
  },
  {
    title: 'Patients',
    detail: 'Review patient records and roster data for smoother care coordination.',
    to: '/patients',
    tone: 'neutral',
  },
  {
    title: 'Analytics',
    detail: 'Inspect operational KPIs, throughput, and completion rates in real time.',
    to: '/analytics',
    tone: 'neutral',
  },
];

function AnimatedKpiValue({ value, suffix = '' }) {
  const numericValue = Number(value) || 0;
  const animatedValue = useCountUp(numericValue, 700);
  return <>{`${animatedValue}${suffix}`}</>;
}

export default function DashboardPage() {
  const { user, unreadMessages } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [overview, setOverview] = useState(null);
  const [telemedicineSessions, setTelemedicineSessions] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [actionMessage, setActionMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(() => {
    setLoading(true);
    setError('');
    return Promise.all([
      listAppointments({ from: new Date().toISOString() }),
      listTelemedicineSessions(),
      user.role !== 'patient' ? getOverview() : Promise.resolve({ data: null }),
      user.role === 'patient'
        ? listAppointments({ to: new Date().toISOString(), status: 'completed' })
        : Promise.resolve({ data: [] }),
    ])
      .then(([appointmentsRes, sessionsRes, overviewRes, historyRes]) => {
        setUpcoming(
          (appointmentsRes.data || [])
            .filter((appt) => ['scheduled', 'confirmed'].includes(appt.status))
            .slice(0, 6)
        );
        setTelemedicineSessions(sessionsRes.data || []);
        setOverview(overviewRes.data || null);
        setVisitHistory(historyRes.data || []);
      })
      .catch(() => setError('Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  }, [user.role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const dashboardData = useMemo(() => {
    const nextAppointment = upcoming[0] || null;
    const telemedicineCount = upcoming.filter((appt) => appt.type === 'telemedicine').length;
    const soonCount = upcoming.filter((appt) => {
      const diff = new Date(appt.scheduledAt).getTime() - Date.now();
      return diff > 0 && diff <= 24 * 60 * 60 * 1000;
    }).length;
    const nextTelemedicine = upcoming.find(
      (appt) => appt.type === 'telemedicine' && appt.TelemedicineSession?.roomCode
    );
    const latestSummarySession = [...telemedicineSessions]
      .reverse()
      .find((session) => parseAppointmentNotes(session.Appointment?.notes).consultationSummary);

    return {
      nextAppointment,
      telemedicineCount,
      soonCount,
      nextTelemedicine,
      latestSummary: latestSummarySession
        ? parseAppointmentNotes(latestSummarySession.Appointment?.notes)
        : null,
    };
  }, [telemedicineSessions, upcoming]);

  const visitHistoryData = useMemo(() => {
    const sorted = [...visitHistory].sort(
      (left, right) => new Date(right.scheduledAt).getTime() - new Date(left.scheduledAt).getTime()
    );
    const latest = sorted[0] || null;
    return {
      all: sorted,
      latest,
      count: sorted.length,
      condition:
        latest?.reason || parseAppointmentNotes(latest?.notes).consultationSummary || 'General care follow-up',
    };
  }, [visitHistory]);

  const patientStats = [
    { label: 'Upcoming visits', value: upcoming.length },
    { label: 'Virtual visits', value: dashboardData.telemedicineCount },
    { label: 'Unread messages', value: unreadMessages },
    { label: 'Starting within 24h', value: dashboardData.soonCount },
  ];

  const providerStats = overview
    ? [
        { label: 'Patients', value: overview.totalPatients },
        { label: 'Completed consults', value: overview.completedAppointments },
        { label: 'Telemedicine visits', value: overview.telemedicineAppointments },
        { label: 'Completion rate', value: overview.completionRate, suffix: '%' },
      ]
    : [];

  const patientTasks = [
    {
      title: 'Pre-arrival intake',
      detail: 'Keep your registration, consent, and emergency contact data current.',
    },
    {
      title: 'Secure follow-up',
      detail:
        unreadMessages > 0
          ? `${unreadMessages} unread secure message${unreadMessages === 1 ? '' : 's'} need review.`
          : 'No unread clinical or administrative follow-up right now.',
    },
    {
      title: 'Virtual care ready',
      detail: dashboardData.nextTelemedicine
        ? `Next virtual room: ${dashboardData.nextTelemedicine.TelemedicineSession.roomCode}.`
        : 'No telemedicine room is waiting at the moment.',
    },
  ];

  const providerActions = [
    { label: 'Review appointments', to: '/appointments' },
    { label: 'Open analytics workspace', to: '/analytics' },
  ];

  const workflowModules = user.role === 'patient' ? PATIENT_MODULES : PROVIDER_MODULES;

  const handleNavigate = (to) => {
    navigate(to);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCheckIn = async () => {
    if (!dashboardData.nextAppointment) return;
    try {
      await checkInAppointment(dashboardData.nextAppointment.id);
      setActionMessage('Check-in completed. The care team can now see that you have arrived.');
      loadDashboard();
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Unable to complete check-in.');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="card loading-panel">
          <div className="status-spinner" />
          <h3 style={{ margin: 0 }}>Loading dashboard</h3>
          <p className="section-copy" style={{ margin: 0, maxWidth: 560 }}>
            Syncing schedules, messages, analytics, and virtual care data.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="hero-card dashboard-hero-card motion-rise">
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-copy">
            <div className="page-eyebrow">
              {user.role === 'patient'
                ? 'Patient Portal'
                : user.role === 'admin'
                ? 'Admin Portal'
                : 'Provider Workspace'}
            </div>
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>
              {(() => {
                const hour = new Date().getHours();
                const timeGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
                const name = user.role !== 'patient' ? `Dr. ${user.lastName || user.firstName}` : user.firstName;
                return `${timeGreeting}, ${name} 👋`;
              })()}
            </h2>
            <p className="section-copy" style={{ maxWidth: 680 }}>
              {user.role === 'patient'
                ? 'Stay on top of your care journey, appointments, messages, and virtual visits in one patient portal.'
                : user.role === 'admin'
                ? 'Manage hospital operations, user provisioning, and reporting from one secure admin workspace.'
                : 'Stay connected to patients, schedules, and care workflows in one provider workspace.'}
            </p>
            <div className="hero-actions dashboard-hero-actions">
              <button
                className="btn"
                type="button"
                onClick={() => handleNavigate(user.role === 'patient' ? '/appointments' : user.role === 'admin' ? '/patients' : '/analytics')}
              >
                {user.role === 'patient'
                  ? 'Book or review appointments'
                  : user.role === 'admin'
                  ? 'Open patient roster'
                  : 'Open analytics'}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => handleNavigate(user.role === 'patient' ? '/registration' : '/analytics')}
              >
                {user.role === 'patient' ? 'Complete registration' : 'Open analytics'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh dashboard'}
              </button>
            </div>
          </div>

          <aside className="dashboard-hero-panel">
            <div className="dashboard-status-header">
              <div>
                <div className="page-eyebrow">Dashboard snapshot</div>
                <h3 style={{ margin: '8px 0 0' }}>
                  {user.role === 'patient' ? 'Your care summary' : 'Today’s provider workflow'}
                </h3>
              </div>
              <span className="badge badge-primary">Active</span>
            </div>

            <div className="dashboard-status-list">
              <div className="dashboard-status-row">
                <strong>Next appointment</strong>
                <span>
                  {dashboardData.nextAppointment
                    ? new Date(dashboardData.nextAppointment.scheduledAt).toLocaleString()
                    : 'No upcoming visits'}
                </span>
              </div>
              <div className="dashboard-status-row">
                <strong>Unread messages</strong>
                <span>{unreadMessages}</span>
              </div>
              <div className="dashboard-status-row">
                <strong>{user.role === 'patient' ? 'Virtual visits' : 'Telemedicine rooms'}</strong>
                <span>{dashboardData.telemedicineCount}</span>
              </div>
              <div className="dashboard-status-row">
                <strong>{user.role === 'patient' ? 'Within 24h' : 'Today’s appointments'}</strong>
                <span>
                  {user.role === 'patient'
                    ? dashboardData.soonCount
                    : overview?.todayAppointments ?? '—'}
                </span>
              </div>
            </div>

            <div className="dashboard-status-actions">
              <button className="btn btn-secondary" type="button" onClick={() => handleNavigate('/appointments')}>
                View schedule
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => handleNavigate(user.role === 'patient' ? '/messages' : '/analytics')}>
                {user.role === 'patient' ? 'Open messages' : 'Open analytics'}
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="dashboard-stats-grid motion-rise delay-1">
        {(user.role === 'patient' ? patientStats : providerStats).map((item) => (
          <div className="stat-card" key={item.label}>
            <div className="stat-value">
              <AnimatedKpiValue value={item.value} suffix={item.suffix || ''} />
            </div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </section>

      {user.role === 'patient' && (
        <section className="dashboard-history-section motion-rise delay-2">
          <div className="card">
            <div className="section-header">
              <div>
                <div className="page-eyebrow">Visit history</div>
                <h3 style={{ margin: '6px 0 0' }}>Hospital visit records</h3>
              </div>
              <span className="badge badge-primary">
                {visitHistoryData.count} completed visit{visitHistoryData.count === 1 ? '' : 's'}
              </span>
            </div>
            {visitHistoryData.count > 0 ? (
              <div className="visit-history-body">
                <p className="section-copy" style={{ marginBottom: 18 }}>
                  You have {visitHistoryData.count} completed hospital visit{visitHistoryData.count === 1 ? '' : 's'}. Your most recent visit was for <strong>{visitHistoryData.condition}</strong>.
                </p>
                <div className="visit-history-list">
                  {visitHistoryData.all.slice(0, 3).map((visit) => (
                    <div className="visit-history-item" key={visit.id}>
                      <div>
                        <strong>{new Date(visit.scheduledAt).toLocaleDateString()}</strong>
                        <div className="visit-history-meta">
                          {visit.type === 'telemedicine' ? 'Telemedicine' : 'In-person'} · {visit.reason || parseAppointmentNotes(visit.notes).consultationSummary || 'General care'}
                        </div>
                      </div>
                      <span className={`badge badge-${visit.status}`}>{visit.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="section-copy" style={{ margin: 0 }}>
                We don’t find any completed hospital visits in your profile yet. After your first visit, your latest reason, status, and condition notes will appear here.
              </p>
            )}
          </div>
        </section>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {user.role !== 'patient' && (
        <section className="dashboard-waiting-section motion-rise delay-2">
          <div className="dashboard-waiting-card">
            <div className="waiting-card-header">
              <div>
                <div className="page-eyebrow">Waiting Patients</div>
                <h3 style={{ margin: '6px 0 0' }}>Current queue</h3>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => handleNavigate('/appointments')}>
                View All
              </button>
            </div>
            <div className="waiting-list">
              {upcoming.slice(0, 5).map((appt) => (
                <div className="waiting-item" key={appt.id}>
                  <div>
                    <div className="waiting-title">
                      {appt.Patient?.User
                        ? `${appt.Patient.User.firstName} ${appt.Patient.User.lastName}`
                        : 'Patient'}
                    </div>
                    <div className="waiting-meta">
                      {new Date(appt.scheduledAt).toLocaleString()} · {appt.type.replace('_', ' ')}
                    </div>
                  </div>
                  <span className={`waiting-status badge badge-${appt.status}`}> {appt.status.replace('_', ' ')} </span>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p style={{ margin: 0, color: 'var(--color-muted)' }}>
                  No waiting patients at the moment.
                </p>
              )}
            </div>
          </div>

          <div className="dashboard-alert-card">
            <div className="page-eyebrow">Critical Lab Alert</div>
            <h3 style={{ margin: '8px 0 0' }}>
              {dashboardData.latestSummary?.consultationSummary
                ? 'Action needed for recent findings'
                : 'Scanner ready for critical alerts'}
            </h3>
            <p style={{ color: 'var(--color-muted)', marginTop: 10 }}>
              {dashboardData.latestSummary?.consultationSummary ||
                'No critical lab alerts right now. Patient flow is stable and ready for the next review.'}
            </p>
            <button className="btn" type="button" onClick={() => handleNavigate('/appointments')}>
              Review
            </button>
          </div>
        </section>
      )}

      <section className="dashboard-mission-strip motion-rise delay-1">
        <div className="dashboard-mission-item">
          <span>Now active</span>
          <strong>{user.role === 'patient' ? 'Personal care workflow' : 'Clinical operations workflow'}</strong>
        </div>
        <div className="dashboard-mission-item">
          <span>Priority signal</span>
          <strong>
            {user.role === 'patient'
              ? `${dashboardData.soonCount} visit${dashboardData.soonCount === 1 ? '' : 's'} within 24h`
              : `${overview?.todayAppointments || 0} appointment${overview?.todayAppointments === 1 ? '' : 's'} today`}
          </strong>
        </div>
        <div className="dashboard-mission-item">
          <span>Next action</span>
          <strong>
            {user.role === 'patient'
              ? (dashboardData.nextAppointment ? 'Prepare and check in' : 'Book next visit')
              : 'Review queue and status'}
          </strong>
        </div>
      </section>

      {dashboardData.nextAppointment && (
        <div className="card motion-rise delay-2" style={{ marginBottom: 16 }}>
          <div className="section-header">
            <div>
              <div className="page-eyebrow">Next appointment spotlight</div>
              <h3 style={{ margin: '4px 0 0' }}>
                {new Date(dashboardData.nextAppointment.scheduledAt).toLocaleString()}
              </h3>
            </div>
            <span className={`badge badge-${dashboardData.nextAppointment.status}`}>
              {dashboardData.nextAppointment.status.replace('_', ' ')}
            </span>
          </div>
          <div className="info-list compact-list">
            <div className="info-row">
              <strong>Visit type</strong>
              <span>{dashboardData.nextAppointment.type.replace('_', ' ')}</span>
            </div>
            <div className="info-row">
              <strong>Room code</strong>
              <span>{dashboardData.nextAppointment.TelemedicineSession?.roomCode || 'In-person visit'}</span>
            </div>
            <div className="info-row">
              <strong>Reason</strong>
              <span>{dashboardData.nextAppointment.reason || 'General consultation'}</span>
            </div>
          </div>
        </div>
      )}

      {actionMessage && (
        <div
          className={
            actionMessage.toLowerCase().includes('unable') ? 'alert alert-error' : 'alert alert-success'
          }
        >
          {actionMessage}
        </div>
      )}

      <div className="grid grid-4 motion-rise delay-2">
        {(user.role === 'patient' ? patientStats : providerStats).map((item) => (
          <div className="card stat-card" key={item.label}>
            <div className="kpi-value">
              <AnimatedKpiValue value={item.value} suffix={item.suffix || ''} />
            </div>
            <div className="kpi-label">{item.label}</div>
          </div>
        ))}
      </div>

      <section className="card dashboard-module-section motion-rise delay-3">
        <div className="section-header">
          <div>
            <div className="page-eyebrow">Core modules</div>
            <h3 style={{ margin: '4px 0 0' }}>Everything in one coordinated workspace</h3>
          </div>
        </div>
        <div className="dashboard-module-grid">
          {workflowModules.map((module) => (
            <button
              key={module.title}
              type="button"
              className={`dashboard-module-card dashboard-module-card-${module.tone}`}
              onClick={() => handleNavigate(module.to)}
            >
              <div className="dashboard-module-card-top">
                <strong>{module.title}</strong>
                <span>Open</span>
              </div>
              <p>{module.detail}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-2 dashboard-layout motion-rise delay-3" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="section-header">
            <div>
              <div className="page-eyebrow">Daily schedule stream</div>
              <h3 style={{ margin: '4px 0 0' }}>Upcoming appointments</h3>
            </div>
            {dashboardData.nextAppointment && (
              <span className="badge badge-confirmed">
                Next:{' '}
                {new Date(dashboardData.nextAppointment.scheduledAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--color-muted)' }}>Nothing scheduled right now.</p>
          ) : (
            <div className="schedule-list">
              {upcoming.map((appt) => (
                <div className="schedule-item" key={appt.id}>
                  <div>
                    <div className="schedule-title">
                      {user.role === 'doctor'
                        ? `${appt.Patient?.User?.firstName || ''} ${appt.Patient?.User?.lastName || ''}`
                        : `Dr. ${appt.Doctor?.User?.firstName || ''} ${appt.Doctor?.User?.lastName || ''}`}
                    </div>
                    <div className="schedule-meta">
                      {new Date(appt.scheduledAt).toLocaleString()} · {appt.type.replace('_', ' ')}
                    </div>
                    {appt.type === 'telemedicine' && appt.TelemedicineSession?.roomCode && (
                      <div className="schedule-meta">
                        Room code: {appt.TelemedicineSession.roomCode}
                      </div>
                    )}
                  </div>
                  <span className={`badge badge-${appt.status}`}>{appt.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid page-stack">
          <div className="card">
            <div className="page-eyebrow">Operational focus</div>
            <h3 style={{ marginTop: 4 }}>
              {user.role === 'patient' ? 'Care tasks and reminders' : 'Quick actions for the day'}
            </h3>
            <div className="info-list">
              {user.role === 'patient' ? (
                <>
                  {patientTasks.map((task) => (
                    <div className="info-row" key={task.title}>
                      <strong>{task.title}</strong>
                      <span>{task.detail}</span>
                    </div>
                  ))}
                  {dashboardData.nextAppointment && (
                    <button className="btn" type="button" onClick={handleCheckIn}>
                      Quick check-in
                    </button>
                  )}
                </>
              ) : (
                <div className="command-grid">
                  {providerActions.map((action) => (
                    <button
                      className="quick-link command-button"
                      key={action.label}
                      type="button"
                      onClick={() => handleNavigate(action.to)}
                    >
                      {action.label}
                    </button>
                  ))}
                  <button
                    className="quick-link command-button command-button-primary"
                    type="button"
                    onClick={() => handleNavigate('/profile')}
                  >
                    Open my profile
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card accent-card">
            <div className="page-eyebrow">Alerts and engagement</div>
            <h3 style={{ marginTop: 4 }}>What needs attention</h3>
            <p className="section-copy" style={{ marginBottom: 0 }}>
              {unreadMessages > 0
                ? `There are ${unreadMessages} unread secure message${unreadMessages === 1 ? '' : 's'} requiring review.`
                : user.role === 'patient'
                  ? 'You are fully caught up. Keep your registration updated before your next visit.'
                  : 'No unread messages right now. Focus on schedule readiness and virtual consultation flow.'}
            </p>
            {dashboardData.latestSummary?.consultationSummary && (
              <div className="summary-block" style={{ marginTop: 16 }}>
                <strong>Latest post-consultation summary</strong>
                <p>{dashboardData.latestSummary.consultationSummary}</p>
                {dashboardData.latestSummary.followUpDirectives && (
                  <p>Follow-up: {dashboardData.latestSummary.followUpDirectives}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
