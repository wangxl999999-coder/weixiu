module.exports = (sequelize, DataTypes) => {
  const OrderPhoto = sequelize.define('OrderPhoto', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '1服务前2服务中3服务后'
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    uploader_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    uploader_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '1用户2师傅'
    }
  }, {
    tableName: 'order_photos',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at'
  });

  OrderPhoto.associate = function(models) {
    OrderPhoto.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
  };

  return OrderPhoto;
};
