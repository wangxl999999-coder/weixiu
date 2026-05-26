require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const config = require('./config');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler');
const operationLogger = require('./middleware/operationLogger');
const routes = require('./routes');

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  maxAge: 86400
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(operationLogger);

app.use('/', routes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    path: req.path,
    method: req.method
  });
});

const PORT = config.server.port || 3000;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✓ 数据库连接成功');

    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: false });
      console.log('✓ 数据库模型同步完成');
    }

    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`  家政维修小程序 API 服务已启动`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  端口: ${PORT}`);
      console.log(`  地址: http://localhost:${PORT}`);
      console.log('========================================');
    });
  } catch (err) {
    console.error('✗ 服务器启动失败:', err);
    process.exit(1);
  }
};

startServer();
