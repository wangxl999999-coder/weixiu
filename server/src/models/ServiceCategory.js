module.exports = (sequelize, DataTypes) => {
  const ServiceCategory = sequelize.define('ServiceCategory', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    parent_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      defaultValue: 0
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true
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
    tableName: 'service_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  ServiceCategory.associate = function(models) {
    ServiceCategory.hasMany(models.Service, { foreignKey: 'category_id', as: 'services' });
    ServiceCategory.hasMany(models.Order, { foreignKey: 'category_id', as: 'orders' });
  };

  return ServiceCategory;
};
