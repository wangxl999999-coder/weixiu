const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    timezone: config.database.timezone,
    pool: config.database.pool,
    logging: config.server.env === 'development' ? console.log : false
  }
);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./User')(sequelize, DataTypes);
db.Worker = require('./Worker')(sequelize, DataTypes);
db.WorkerCertificate = require('./WorkerCertificate')(sequelize, DataTypes);
db.ServiceCategory = require('./ServiceCategory')(sequelize, DataTypes);
db.Service = require('./Service')(sequelize, DataTypes);
db.WorkerService = require('./WorkerService')(sequelize, DataTypes);
db.UserAddress = require('./UserAddress')(sequelize, DataTypes);
db.Order = require('./Order')(sequelize, DataTypes);
db.OrderExtra = require('./OrderExtra')(sequelize, DataTypes);
db.OrderPhoto = require('./OrderPhoto')(sequelize, DataTypes);
db.Payment = require('./Payment')(sequelize, DataTypes);
db.Coupon = require('./Coupon')(sequelize, DataTypes);
db.UserCoupon = require('./UserCoupon')(sequelize, DataTypes);
db.FlashSale = require('./FlashSale')(sequelize, DataTypes);
db.Evaluation = require('./Evaluation')(sequelize, DataTypes);
db.Complaint = require('./Complaint')(sequelize, DataTypes);
db.WorkerWallet = require('./WorkerWallet')(sequelize, DataTypes);
db.Withdrawal = require('./Withdrawal')(sequelize, DataTypes);
db.FinancialRecord = require('./FinancialRecord')(sequelize, DataTypes);
db.Admin = require('./Admin')(sequelize, DataTypes);
db.SystemConfig = require('./SystemConfig')(sequelize, DataTypes);
db.OperationLog = require('./OperationLog')(sequelize, DataTypes);
db.Notification = require('./Notification')(sequelize, DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
