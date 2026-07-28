const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Doctor extends Model {}

  Doctor.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      specialty: { type: DataTypes.STRING, allowNull: false },
      licenseNumber: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      isAvailableForTelemedicine: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'Doctor',
      tableName: 'doctors',
      timestamps: true,
    }
  );

  Doctor.associate = (models) => {
    Doctor.belongsTo(models.User, { foreignKey: 'userId' });
    Doctor.hasMany(models.Appointment, { foreignKey: 'doctorId' });
    Doctor.hasMany(models.TelemedicineSession, { foreignKey: 'doctorId' });
    Doctor.hasOne(models.DoctorAvailability, { foreignKey: 'doctorId', onDelete: 'CASCADE' });
  };

  return Doctor;
};
