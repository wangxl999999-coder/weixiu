module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    payment_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_type: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    },
    payment_scene: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    transaction_id: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    prepay_id: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    paid_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refund_transaction_id: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    refund_time: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Payment.associate = function(models) {
    Payment.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    Payment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Payment;
};
