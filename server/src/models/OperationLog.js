module.exports = (sequelize, DataTypes) => {
  const OperationLog = sequelize.define('OperationLog', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    admin_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    admin_name: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    module: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    target_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    content: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'operation_logs',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  OperationLog.associate = function(models) {
    OperationLog.belongsTo(models.Admin, { foreignKey: 'admin_id', as: 'admin' });
  };

  return OperationLog;
};
