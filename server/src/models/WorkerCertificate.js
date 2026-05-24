module.exports = (sequelize, DataTypes) => {
  const WorkerCertificate = sequelize.define('WorkerCertificate', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    certificate_type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    certificate_name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    certificate_no: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    certificate_image: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    issued_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    audit_status: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    }
  }, {
    tableName: 'worker_certificates',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  WorkerCertificate.associate = function(models) {
    WorkerCertificate.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
  };

  return WorkerCertificate;
};
