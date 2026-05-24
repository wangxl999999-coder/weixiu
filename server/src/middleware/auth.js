const jwt = require('jsonwebtoken');
const config = require('../config');
const { error } = require('../utils/response');
const db = require('../models');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['token'];

  if (!token) {
    return error(res, '未提供认证令牌', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, '令牌已过期', 401);
    }
    return error(res, '无效的认证令牌', 401);
  }
};

const requireUser = async (req, res, next) => {
  verifyToken(req, res, async () => {
    if (req.user.type !== 'user') {
      return error(res, '需要用户权限', 403);
    }
    const user = await db.User.findByPk(req.user.id);
    if (!user || user.status !== 1) {
      return error(res, '用户不存在或已被禁用', 403);
    }
    req.currentUser = user;
    next();
  });
};

const requireWorker = async (req, res, next) => {
  verifyToken(req, res, async () => {
    if (req.user.type !== 'worker') {
      return error(res, '需要师傅权限', 403);
    }
    const worker = await db.Worker.findByPk(req.user.id);
    if (!worker) {
      return error(res, '师傅账号不存在', 403);
    }
    if (worker.status !== 1) {
      return error(res, '账号已被禁用', 403);
    }
    if (worker.audit_status !== 1) {
      return error(res, '账号尚未通过审核', 403);
    }
    req.currentWorker = worker;
    next();
  });
};

const requireAdmin = async (req, res, next) => {
  verifyToken(req, res, async () => {
    if (req.user.type !== 'admin') {
      return error(res, '需要管理员权限', 403);
    }
    const admin = await db.Admin.findByPk(req.user.id);
    if (!admin || admin.status !== 1) {
      return error(res, '管理员账号不存在或已被禁用', 403);
    }
    req.currentAdmin = admin;
    next();
  });
};

const generateToken = (user, type = 'user') => {
  const payload = {
    id: user.id,
    type,
    phone: user.phone,
    name: user.name || user.nickname
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

module.exports = {
  verifyToken,
  requireUser,
  requireWorker,
  requireAdmin,
  generateToken
};
