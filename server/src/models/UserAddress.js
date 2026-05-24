module.exports = (sequelize, DataTypes) => {
  const UserAddress = sequelize.define('UserAddress', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    province: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    district: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    house_number: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    is_default: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    tag: {
      type: DataTypes.STRING(16),
      allowNull: true
    }
  }, {
    tableName: 'user_addresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  UserAddress.associate = function(models) {
    UserAddress.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserAddress.hasMany(models.Order, { foreignKey: 'address_id', as: 'orders' });
  };

  return UserAddress;
};
