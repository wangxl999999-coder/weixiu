const { error } = require('../utils/response');
const config = require('../config');

const notFound = (req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || 500;
  let message = err.message || '服务器内部错误';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    const errors = Object.values(err.errors).map(e => e.message);
    return error(res, message, statusCode, errors);
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的认证令牌';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '认证令牌已过期';
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = '数据已存在';
  }

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    const errors = err.errors.map(e => e.message);
    return error(res, message, statusCode, errors);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = '关联数据不存在';
  }

  if (config.server.env === 'development') {
    console.error('Error:', err);
    return error(res, message, statusCode, {
      stack: err.stack,
      name: err.name
    });
  }

  return error(res, message, statusCode);
};

module.exports = {
  notFound,
  errorHandler
};
