module.exports = (sequelize, DataTypes) => {
  const FinancialRecord = sequelize.define('FinancialRecord', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    record_no: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    withdraw_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '1收入2退款3提现4退回5补贴6扣除'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    balance_after: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'financial_records',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  FinancialRecord.associate = function(models) {
    FinancialRecord.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
    FinancialRecord.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    FinancialRecord.belongsTo(models.Withdrawal, { foreignKey: 'withdraw_id', as: 'withdrawal' });
  };

  return FinancialRecord;
};
