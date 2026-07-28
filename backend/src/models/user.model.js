const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    async validatePassword(password) {
      return bcrypt.compare(password, this.passwordHash);
    }

    toSafeJSON() {
      const { id, firstName, lastName, email, phone, role, createdAt } = this;
      return { id, firstName, lastName, email, phone, role, createdAt };
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: { type: DataTypes.STRING, allowNull: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM('patient', 'doctor', 'admin'),
        allowNull: false,
        defaultValue: 'patient',
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.passwordHash) {
            user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('passwordHash')) {
            user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
          }
        },
      },
    }
  );

  User.associate = (models) => {
    User.hasOne(models.Patient, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasOne(models.Doctor, { foreignKey: 'userId', onDelete: 'CASCADE' });
    User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
    User.hasMany(models.Message, { foreignKey: 'recipientId', as: 'receivedMessages' });
  };

  return User;
};
