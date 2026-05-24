module.exports = (sequelize, DataTypes) => {
  const FlashSale = sequelize.define('FlashSale', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    service_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    service_name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    service_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    flash_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sold_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    limit_per_user: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  }, {
    tableName: 'flash_sales',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  FlashSale.associate = function(models) {
    FlashSale.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  };

  return FlashSale;
};
