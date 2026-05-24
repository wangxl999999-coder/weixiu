module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    order_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
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
    category_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    address_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    address_info: {
      type: DataTypes.JSON,
      allowNull: false
    },
    appointment_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    extra_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    coupon_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    pay_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    worker_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    platform_fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    platform_fee_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 10.00
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0待接单1待上门2服务中3待确认4已完成5已取消6已退款'
    },
    pay_status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0未支付1已支付2已退款'
    },
    pay_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    accept_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    arrive_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    finish_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    confirm_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancel_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancel_reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    dispatch_type: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0抢单1派单'
    },
    dispatch_admin_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    is_extra: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    is_evaluated: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    is_complained: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    refund_status: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    refund_reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Order.associate = function(models) {
    Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Order.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
    Order.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
    Order.belongsTo(models.ServiceCategory, { foreignKey: 'category_id', as: 'category' });
    Order.belongsTo(models.UserAddress, { foreignKey: 'address_id', as: 'address' });
    Order.hasMany(models.OrderExtra, { foreignKey: 'order_id', as: 'extras' });
    Order.hasMany(models.OrderPhoto, { foreignKey: 'order_id', as: 'photos' });
    Order.hasMany(models.Payment, { foreignKey: 'order_id', as: 'payments' });
    Order.hasOne(models.Evaluation, { foreignKey: 'order_id', as: 'evaluation' });
    Order.hasOne(models.Complaint, { foreignKey: 'order_id', as: 'complaint' });
  };

  return Order;
};
