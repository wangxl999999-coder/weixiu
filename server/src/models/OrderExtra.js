module.exports = (sequelize, DataTypes) => {
  const OrderExtra = sequelize.define('OrderExtra', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    user_confirm: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0待确认1已确认2已拒绝'
    },
    confirm_time: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'order_extras',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  OrderExtra.associate = function(models) {
    OrderExtra.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    OrderExtra.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
  };

  return OrderExtra;
};
