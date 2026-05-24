module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    type: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '1满减2折扣3立减'
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    min_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    discount_limit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    total_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    received_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    used_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    valid_type: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '1固定日期2领取后N天'
    },
    valid_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    valid_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    valid_days: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    use_scope: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '1全场2分类3服务'
    },
    scope_ids: {
      type: DataTypes.JSON,
      allowNull: true
    },
    is_new_user: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  }, {
    tableName: 'coupons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Coupon.associate = function(models) {
    Coupon.hasMany(models.UserCoupon, { foreignKey: 'coupon_id', as: 'userCoupons' });
  };

  return Coupon;
};
