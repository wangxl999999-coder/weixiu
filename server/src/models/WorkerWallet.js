module.exports = (sequelize, DataTypes) => {
  const WorkerWallet = sequelize.define('WorkerWallet', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    frozen_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    total_income: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    total_withdraw: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    today_income: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    month_income: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    }
  }, {
    tableName: 'worker_wallets',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
  });

  WorkerWallet.associate = function(models) {
    WorkerWallet.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
  };

  return WorkerWallet;
};
