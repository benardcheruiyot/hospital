import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import AppShell from '../components/AppShell.jsx';
import {
  getOverview,
  getAppointmentsByDay,
  getAppointmentsByDoctor,
  getAppointmentsByStatus,
} from '../services/analyticsApi.js';

const STATUS_COLORS = {
  scheduled: '#94a3b8',
  confirmed: '#1769c2',
  completed: '#2b8a3e',
  cancelled: '#c0392b',
  no_show: '#d97706',
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [byDoctor, setByDoctor] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewRes, byDayRes, byStatusRes, byDoctorRes] = await Promise.all([
          getOverview(),
          getAppointmentsByDay(14),
          getAppointmentsByStatus(),
          getAppointmentsByDoctor(),
        ]);

        if (!active) return;

        setOverview(overviewRes.data);
        setByDay(byDayRes.data.map((r) => ({ day: r.day, count: Number(r.count) })));
        setByStatus(byStatusRes.data.map((r) => ({ name: r.status, value: Number(r.count) })));
        setByDoctor(
          byDoctorRes.data
            .map((row) => ({
              name: row.name,
              specialty: row.specialty,
              count: Number(row.count),
            }))
            .sort((left, right) => right.count - left.count)
        );
      } catch {
        if (active) {
          setError('Unable to load analytics data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      active = false;
    };
  }, []);

  const registrationRate = useMemo(() => {
    if (!overview?.totalPatients) return 0;
    return Number(((overview.verifiedRegistrations / overview.totalPatients) * 100).toFixed(1));
  }, [overview]);

  if (error) {
    return (
      <AppShell>
        <div className="alert alert-error">{error}</div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="card loading-panel">
          <div className="status-spinner" />
          <h3 style={{ margin: 0 }}>Loading analytics</h3>
          <p className="section-copy" style={{ margin: 0, maxWidth: 560 }}>
            Pulling schedule, registration, and virtual care metrics.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="hero-card">
        <div>
          <div className="page-eyebrow">Operational intelligence</div>
          <h2 style={{ margin: '4px 0 10px' }}>Hospital Performance Analytics</h2>
          <p className="section-copy" style={{ maxWidth: 720 }}>
            Track operational throughput, registration progress, virtual care uptake, and provider demand from one analytics workspace aligned to your proposal objectives.
          </p>
        </div>
        <div className="hero-actions hero-summary">
          <div className="hero-metric">
            <span>Today&apos;s visits</span>
            <strong>{overview?.todayAppointments || 0}</strong>
          </div>
          <div className="hero-metric">
            <span>Checked in today</span>
            <strong>{overview?.todayCheckedIn || 0}</strong>
          </div>
          <div className="hero-metric">
            <span>Avg consult</span>
            <strong>{overview?.avgConsultationMinutes || 0}m</strong>
          </div>
        </div>
      </section>

      {overview && (
        <div className="grid grid-4">
          <div className="card stat-card">
            <div className="kpi-value">{overview.totalPatients}</div>
            <div className="kpi-label">Registered patients</div>
          </div>
          <div className="card stat-card">
            <div className="kpi-value">{overview.pendingRegistrations}</div>
            <div className="kpi-label">Pending registrations</div>
          </div>
          <div className="card stat-card">
            <div className="kpi-value">{overview.activeVirtualSessions}</div>
            <div className="kpi-label">Active virtual-ready visits</div>
          </div>
          <div className="card stat-card">
            <div className="kpi-value">{overview.avgWaitingMinutes}m</div>
            <div className="kpi-label">Average pre-visit wait window</div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="page-eyebrow">Trend line</div>
              <h3 style={{ margin: '4px 0 0' }}>Appointment volume</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={byDay}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1769c2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="page-eyebrow">Status mix</div>
              <h3 style={{ margin: '4px 0 0' }}>Appointments by status</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                {byStatus.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2 dashboard-layout">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="page-eyebrow">Virtual care</div>
              <h3 style={{ margin: '4px 0 0' }}>Telemedicine adoption</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[
                {
                  name: 'In-person',
                  value:
                    (overview?.totalAppointments || 0) - (overview?.telemedicineAppointments || 0),
                },
                { name: 'Telemedicine', value: overview?.telemedicineAppointments || 0 },
              ]}
            >
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#1769c2" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card accent-card">
          <div className="page-eyebrow">Operational summary</div>
          <h3 style={{ marginTop: 4 }}>Proposal-aligned KPI snapshot</h3>
          <div className="progress-track" style={{ marginBottom: 16 }}>
            <span style={{ width: `${registrationRate}%` }} />
          </div>
          <div className="info-list compact-list">
            <div className="info-row">
              <strong>Registration verified</strong>
              <span>{registrationRate}% of patients have a verified intake profile.</span>
            </div>
            <div className="info-row">
              <strong>Completion rate</strong>
              <span>{overview?.completionRate || 0}% of all appointments are marked completed.</span>
            </div>
            <div className="info-row">
              <strong>No-show rate</strong>
              <span>{overview?.noShowRate || 0}% of appointments ended in no-show status.</span>
            </div>
            <div className="info-row">
              <strong>Message volume</strong>
              <span>{overview?.totalMessages || 0} secure messages have flowed through the platform.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2 dashboard-layout">
        <div className="card">
          <div className="section-header">
            <div>
              <div className="page-eyebrow">Provider workload</div>
              <h3 style={{ margin: '4px 0 0' }}>Provider demand leaderboard</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDoctor.slice(0, 6)} layout="vertical" margin={{ left: 18, right: 18 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#d96c38" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="page-eyebrow">Provider workload detail</div>
          <h3 style={{ marginTop: 4 }}>Top consultation lanes</h3>
          <div className="schedule-list">
            {byDoctor.slice(0, 5).map((row) => (
              <div className="schedule-item" key={`${row.name}-${row.specialty}`}>
                <div>
                  <div className="schedule-title">{row.name}</div>
                  <div className="schedule-meta">{row.specialty || 'General practice'}</div>
                </div>
                <span className="badge badge-confirmed">
                  {row.count} visit{row.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
