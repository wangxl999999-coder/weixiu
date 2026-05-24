module.exports = (sequelize, DataTypes) => {
  const Worker = sequelize.define('Worker', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    id_card: {
      type: DataTypes.STRING(18),
      allowNull: true
    },
    id_card_front: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    id_card_back: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gender: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    work_years: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00
    },
    order_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    service_area: {
      type: DataTypes.JSON,
      allowNull: true
    },
    work_time: {
      type: DataTypes.JSON,
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
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    deposit: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    audit_status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0待审核1通过2拒绝'
    },
    audit_remark: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    audit_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0禁用1正常2休息中'
    },
    is_accept_order: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  }, {
    tableName: 'workers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Worker.associate = function(models) {
    Worker.hasMany(models.WorkerCertificate, { foreignKey: 'worker_id', as: 'certificates' });
    Worker.hasMany(models.WorkerService, { foreignKey: 'worker_id', as: 'services' });
    Worker.hasMany(models.Order, { foreignKey: 'worker_id', as: 'orders' });
    Worker.hasOne(models.WorkerWallet, { foreignKey: 'worker_id', as: 'wallet' });
    Worker.hasMany(models.FinancialRecord, { foreignKey: 'worker_id', as: 'financialRecords' });
    Worker.hasMany(models.Withdrawal, { foreignKey: 'worker_id', as: 'withdrawals' });
    Worker.hasMany(models.Evaluation, { foreignKey: 'worker_id', as: 'evaluations' });
    Worker.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications', scope: { user_type: 2 } });
  };

  return Worker;
};
