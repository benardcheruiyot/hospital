const { Op, fn, col, literal } = require('sequelize');
const { Appointment, Patient, Doctor, Message } = require('../models');

// GET /api/analytics/overview
// Returns headline KPIs used on the admin dashboard
const getOverview = async (req, res) => {
  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    telemedicineAppointments,
    totalMessages,
    pendingRegistrations,
    verifiedRegistrations,
    todayAppointments,
    todayCheckedIn,
    activeVirtualSessions,
  ] = await Promise.all([
    Patient.count(),
    Doctor.count(),
    Appointment.count(),
    Appointment.count({ where: { status: 'completed' } }),
    Appointment.count({ where: { status: 'cancelled' } }),
    Appointment.count({ where: { status: 'no_show' } }),
    Appointment.count({ where: { type: 'telemedicine' } }),
    Message.count(),
    Patient.count({ where: { registrationStatus: 'pending' } }),
    Patient.count({ where: { registrationStatus: 'verified' } }),
    Appointment.count({
      where: {
        scheduledAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          [Op.lt]: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
    }),
    Appointment.count({
      where: {
        checkedInAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          [Op.lt]: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
    }),
    Appointment.count({ where: { type: 'telemedicine', status: 'confirmed' } }),
  ]);

  const checkedInRows = await Appointment.findAll({
    attributes: ['checkedInAt', 'scheduledAt', 'completedAt'],
    where: {
      checkedInAt: { [Op.ne]: null },
    },
    raw: true,
  });

  const avgWaitingMinutes = checkedInRows.length
    ? Number(
        (
          checkedInRows.reduce((acc, row) => {
            const scheduledAt = new Date(row.scheduledAt).getTime();
            const checkedInAt = new Date(row.checkedInAt).getTime();
            return acc + Math.max(0, (scheduledAt - checkedInAt) / 60000);
          }, 0) / checkedInRows.length
        ).toFixed(1)
      )
    : 0;

  const avgConsultationMinutes = checkedInRows.filter((row) => row.completedAt).length
    ? Number(
        (
          checkedInRows
            .filter((row) => row.completedAt)
            .reduce((acc, row) => {
              const checkedInAt = new Date(row.checkedInAt).getTime();
              const completedAt = new Date(row.completedAt).getTime();
              return acc + Math.max(0, (completedAt - checkedInAt) / 60000);
            }, 0) / checkedInRows.filter((row) => row.completedAt).length
        ).toFixed(1)
      )
    : 0;

  const completionRate = totalAppointments
    ? Number(((completedAppointments / totalAppointments) * 100).toFixed(1))
    : 0;
  const noShowRate = totalAppointments
    ? Number(((noShowAppointments / totalAppointments) * 100).toFixed(1))
    : 0;

  res.json({
    success: true,
    data: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      telemedicineAppointments,
      totalMessages,
      pendingRegistrations,
      verifiedRegistrations,
      todayAppointments,
      todayCheckedIn,
      activeVirtualSessions,
      avgWaitingMinutes,
      avgConsultationMinutes,
      completionRate,
      noShowRate,
    },
  });
};

// GET /api/analytics/appointments-by-day?days=14
// Time series for charting appointment volume
const getAppointmentsByDay = async (req, res) => {
  const days = Number(req.query.days) || 14;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await Appointment.findAll({
    attributes: [
      [fn('DATE', col('scheduledAt')), 'day'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where: { scheduledAt: { [Op.gte]: since } },
    group: [literal('1')],
    order: [literal('1 ASC')],
    raw: true,
  });

  res.json({ success: true, data: rows });
};

// GET /api/analytics/appointments-by-status
const getAppointmentsByStatus = async (req, res) => {
  const rows = await Appointment.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });
  res.json({ success: true, data: rows });
};

// GET /api/analytics/appointments-by-doctor
const getAppointmentsByDoctor = async (req, res) => {
  const doctors = await Doctor.findAll({
    include: [{ association: 'User', attributes: ['firstName', 'lastName'] }],
  });

  const counts = await Appointment.findAll({
    attributes: ['doctorId', [fn('COUNT', col('id')), 'count']],
    group: ['doctorId'],
    raw: true,
  });

  const countMap = new Map(counts.map((row) => [row.doctorId, Number(row.count)]));
  const rows = doctors.map((doctor) => ({
    doctorId: doctor.id,
    name: `Dr. ${doctor.User?.firstName || ''} ${doctor.User?.lastName || ''}`.trim(),
    specialty: doctor.specialty,
    count: countMap.get(doctor.id) || 0,
  }));

  res.json({ success: true, data: rows });
};

module.exports = {
  getOverview,
  getAppointmentsByDay,
  getAppointmentsByStatus,
  getAppointmentsByDoctor,
};
