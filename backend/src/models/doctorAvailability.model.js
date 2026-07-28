const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class DoctorAvailability extends Model {}

  DoctorAvailability.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      doctorId: { type: DataTypes.UUID, allowNull: false, unique: true },
      availableDays: { type: DataTypes.TEXT, allowNull: false, defaultValue: JSON.stringify([1, 2, 3, 4, 5]) },
      startHour: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 9 },
      endHour: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 17 },
      slotMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'DoctorAvailability',
      tableName: 'doctor_availabilities',
      timestamps: true,
    }
  );

  DoctorAvailability.associate = (models) => {
    DoctorAvailability.belongsTo(models.Doctor, { foreignKey: 'doctorId' });
  };

  return DoctorAvailability;
};
