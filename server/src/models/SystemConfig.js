module.exports = (sequelize, DataTypes) => {
  const SystemConfig = sequelize.define('SystemConfig', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    config_key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    config_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    config_desc: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    config_group: {
      type: DataTypes.STRING(32),
      defaultValue: 'basic'
    },
    type: {
      type: DataTypes.STRING(16),
      defaultValue: 'string'
    }
  }, {
    tableName: 'system_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return SystemConfig;
};
