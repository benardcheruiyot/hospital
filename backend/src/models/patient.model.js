const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Patient extends Model {}

  Patient.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true,
      },
      nationalId: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      emergencyContactName: { type: DataTypes.STRING, allowNull: true },
      emergencyContactPhone: { type: DataTypes.STRING, allowNull: true },
      bloodGroup: { type: DataTypes.STRING, allowNull: true },
      allergies: { type: DataTypes.TEXT, allowNull: true },
      registrationStatus: {
        type: DataTypes.ENUM('pending', 'verified', 'incomplete'),
        defaultValue: 'pending',
      },
      consentGiven: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: 'Patient',
      tableName: 'patients',
      timestamps: true,
    }
  );

  Patient.associate = (models) => {
    Patient.belongsTo(models.User, { foreignKey: 'userId' });
    Patient.hasMany(models.Appointment, { foreignKey: 'patientId' });
    Patient.hasMany(models.TelemedicineSession, { foreignKey: 'patientId' });
  };

  return Patient;
};
