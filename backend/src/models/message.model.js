const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Message extends Model {}

  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      senderId: { type: DataTypes.UUID, allowNull: false },
      recipientId: { type: DataTypes.UUID, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      timestamps: true,
      indexes: [{ fields: ['senderId', 'recipientId'] }],
    }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
    Message.belongsTo(models.User, { foreignKey: 'recipientId', as: 'recipient' });
  };

  return Message;
};
