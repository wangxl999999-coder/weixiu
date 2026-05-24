module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    user_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '1用户2师傅'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    content: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    is_read: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    read_time: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  return Notification;
};
