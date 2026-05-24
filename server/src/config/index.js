require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'home_repair_jwt_secret_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'home_repair',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    timezone: '+08:00',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  wechat: {
    user: {
      appid: process.env.WX_APPID || 'wx_user_appid',
      secret: process.env.WX_SECRET || 'wx_user_secret'
    },
    worker: {
      appid: process.env.WX_WORKER_APPID || 'wx_worker_appid',
      secret: process.env.WX_WORKER_SECRET || 'wx_worker_secret'
    },
    pay: {
      mchid: process.env.WX_PAY_MCHID || '1234567890',
      key: process.env.WX_PAY_KEY || 'wx_pay_api_key',
      certPath: process.env.WX_PAY_CERT_PATH || './config/cert/apiclient_cert.pem',
      keyPath: process.env.WX_PAY_KEY_PATH || './config/cert/apiclient_key.pem',
      notifyUrl: process.env.WX_NOTIFY_URL || 'https://api.example.com/api/payment/notify'
    }
  },
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/jpg']
  },
  sms: {
    accessKey: process.env.SMS_ACCESS_KEY || '',
    secretKey: process.env.SMS_SECRET_KEY || '',
    signName: process.env.SMS_SIGN_NAME || '家政维修'
  },
  amap: {
    key: process.env.AMAP_KEY || ''
  },
  platform: {
    defaultFeeRate: 10.00,
    minWithdraw: 100.00,
    serviceRadius: 10,
    depositAmount: 2000.00
  }
};
