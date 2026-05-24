module.exports = (sequelize, DataTypes) => {
  const WorkerService = sequelize.define('WorkerService', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    service_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    custom_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    is_enabled: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  }, {
    tableName: 'worker_services',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  WorkerService.associate = function(models) {
    WorkerService.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
    WorkerService.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  };

  return WorkerService;
};
