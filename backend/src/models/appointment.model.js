const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Appointment extends Model {}

  Appointment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      patientId: { type: DataTypes.UUID, allowNull: false },
      doctorId: { type: DataTypes.UUID, allowNull: false },
      scheduledAt: { type: DataTypes.DATE, allowNull: false },
      durationMinutes: { type: DataTypes.INTEGER, defaultValue: 30 },
      type: {
        type: DataTypes.ENUM('in_person', 'telemedicine'),
        defaultValue: 'in_person',
      },
      status: {
        type: DataTypes.ENUM(
          'scheduled',
          'confirmed',
          'completed',
          'cancelled',
          'no_show'
        ),
        defaultValue: 'scheduled',
      },
      reason: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      checkedInAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Appointment',
      tableName: 'appointments',
      timestamps: true,
      indexes: [
        { fields: ['patientId'] },
        { fields: ['doctorId'] },
        { fields: ['scheduledAt'] },
      ],
    }
  );

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.Patient, { foreignKey: 'patientId' });
    Appointment.belongsTo(models.Doctor, { foreignKey: 'doctorId' });
    Appointment.hasOne(models.TelemedicineSession, { foreignKey: 'appointmentId' });
  };

  return Appointment;
};
