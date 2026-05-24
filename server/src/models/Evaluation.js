module.exports = (sequelize, DataTypes) => {
  const Evaluation = sequelize.define('Evaluation', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    service_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    content: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    is_anonymous: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    reply_content: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    reply_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  }, {
    tableName: 'evaluations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Evaluation.associate = function(models) {
    Evaluation.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    Evaluation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Evaluation.belongsTo(models.Worker, { foreignKey: 'worker_id', as: 'worker' });
    Evaluation.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
  };

  return Evaluation;
};
