module.exports = (sequelize, DataTypes) => {
  const Withdrawal = sequelize.define('Withdrawal', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    withdraw_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    worker_name: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    actual_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    withdraw_type: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '1微信零钱'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0待审核1通过2拒绝3转账中4成功5失败'
    },
    audit_admin_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    audit_remark: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    audit_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    transfer_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    transfer_no: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    fail_reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'withdrawals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Withdrawal.associate = function(models) {
    Withdrawal.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
  };

  return Withdrawal;
};
