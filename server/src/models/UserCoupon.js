module.exports = (sequelize, DataTypes) => {
  const UserCoupon = sequelize.define('UserCoupon', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    coupon_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    min_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    valid_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    valid_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0未使用1已使用2已过期3已作废'
    },
    used_time: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_coupons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  UserCoupon.associate = function(models) {
    UserCoupon.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserCoupon.belongsTo(models.Coupon, { foreignKey: 'coupon_id', as: 'coupon' });
  };

  return UserCoupon;
};
