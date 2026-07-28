const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class TelemedicineSession extends Model {}

  TelemedicineSession.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      appointmentId: { type: DataTypes.UUID, allowNull: false },
      patientId: { type: DataTypes.UUID, allowNull: false },
      doctorId: { type: DataTypes.UUID, allowNull: false },
      roomCode: { type: DataTypes.STRING, allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM('scheduled', 'active', 'ended', 'cancelled'),
        defaultValue: 'scheduled',
      },
      startedAt: { type: DataTypes.DATE, allowNull: true },
      endedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'TelemedicineSession',
      tableName: 'telemedicine_sessions',
      timestamps: true,
    }
  );

  TelemedicineSession.associate = (models) => {
    TelemedicineSession.belongsTo(models.Appointment, { foreignKey: 'appointmentId' });
    TelemedicineSession.belongsTo(models.Patient, { foreignKey: 'patientId' });
    TelemedicineSession.belongsTo(models.Doctor, { foreignKey: 'doctorId' });
  };

  return TelemedicineSession;
};
