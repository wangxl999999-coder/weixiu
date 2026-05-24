module.exports = (sequelize, DataTypes) => {
  const Complaint = sequelize.define('Complaint', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    content: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0待处理1处理中2已处理3已驳回'
    },
    handle_admin_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    handle_result: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    handle_time: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'complaints',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Complaint.associate = function(models) {
    Complaint.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    Complaint.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Complaint.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
  };

  return Complaint;
};
