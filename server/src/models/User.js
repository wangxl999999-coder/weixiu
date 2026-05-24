module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    openid: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    unionid: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    nickname: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    gender: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0未知1男2女'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '0禁用1正常'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = function(models) {
    User.hasMany(models.UserAddress, { foreignKey: 'user_id', as: 'addresses' });
    User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
    User.hasMany(models.UserCoupon, { foreignKey: 'user_id', as: 'coupons' });
    User.hasMany(models.Evaluation, { foreignKey: 'user_id', as: 'evaluations' });
    User.hasMany(models.Complaint, { foreignKey: 'user_id', as: 'complaints' });
    User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications', scope: { user_type: 1 } });
  };

  return User;
};
