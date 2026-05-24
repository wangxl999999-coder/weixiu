module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    banner: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    unit: {
      type: DataTypes.STRING(16),
      defaultValue: '次'
    },
    service_time: {
      type: DataTypes.INTEGER,
      defaultValue: 60
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notice: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sales_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  }, {
    tableName: 'services',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Service.associate = function(models) {
    Service.belongsTo(models.ServiceCategory, { foreignKey: 'category_id', as: 'category' });
    Service.hasMany(models.WorkerService, { foreignKey: 'service_id', as: 'workerServices' });
    Service.hasMany(models.Order, { foreignKey: 'service_id', as: 'orders' });
    Service.hasMany(models.FlashSale, { foreignKey: 'service_id', as: 'flashSales' });
  };

  return Service;
};
