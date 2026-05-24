const bcrypt = require('bcryptjs');
const db = require('../models');
const { success, error } = require('../utils/response');
const { generateToken } = require('../middleware/auth');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400);
    }

    const admin = await db.Admin.findOne({ where: { username } });

    if (!admin) {
      return error(res, '账号不存在', 404);
    }

    if (admin.status !== 1) {
      return error(res, '账号已被禁用', 403);
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return error(res, '密码错误', 400);
    }

    await admin.update({
      last_login_time: new Date(),
      last_login_ip: req.ip || req.connection.remoteAddress
    });

    const token = generateToken(admin, 'admin');

    success(res, {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        avatar: admin.avatar,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions
      }
    }, '登录成功');
  } catch (err) {
    console.error('管理员登录错误:', err);
    error(res, err.message || '登录失败', 500);
  }
};

const getAdminInfo = async (req, res) => {
  try {
    const admin = req.currentAdmin;

    success(res, {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      avatar: admin.avatar,
      phone: admin.phone,
      role: admin.role,
      permissions: admin.permissions
    });
  } catch (err) {
    console.error('获取管理员信息错误:', err);
    error(res, '获取失败', 500);
  }
};

const updatePassword = async (req, res) => {
  try {
    const adminId = req.currentAdmin.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return error(res, '缺少必要参数', 400);
    }

    if (new_password.length < 6) {
      return error(res, '新密码长度不能少于6位', 400);
    }

    const admin = await db.Admin.findByPk(adminId);
    const isValid = await bcrypt.compare(old_password, admin.password);

    if (!isValid) {
      return error(res, '原密码错误', 400);
    }

    const hashedPassword = await bcrypt.hash(new_password, 12);
    await admin.update({ password: hashedPassword });

    success(res, null, '密码修改成功');
  } catch (err) {
    console.error('修改密码错误:', err);
    error(res, err.message || '修改失败', 500);
  }
};

const getAdminList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    const { Op } = db.Sequelize;

    const where = {};
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await db.Admin.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize),
      attributes: ['id', 'username', 'name', 'avatar', 'phone', 'role', 'status', 'last_login_time']
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取管理员列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const createAdmin = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { username, password, name, phone, role, permissions } = req.body;

    if (!username || !password || !name) {
      return error(res, '缺少必要参数', 400);
    }

    const existAdmin = await db.Admin.findOne({ where: { username }, transaction: t });
    if (existAdmin) {
      await t.rollback();
      return error(res, '用户名已存在', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await db.Admin.create({
      username,
      password: hashedPassword,
      name,
      phone,
      role,
      permissions,
      status: 1
    }, { transaction: t });

    await t.commit();

    success(res, { id: admin.id }, '创建成功');
  } catch (err) {
    await t.rollback();
    console.error('创建管理员错误:', err);
    error(res, err.message || '创建失败', 500);
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, permissions, status } = req.body;

    const admin = await db.Admin.findByPk(id);
    if (!admin) {
      return error(res, '管理员不存在', 404);
    }

    await admin.update({ name, phone, role, permissions, status });

    success(res, null, '更新成功');
  } catch (err) {
    console.error('更新管理员错误:', err);
    error(res, err.message || '更新失败', 500);
  }
};

module.exports = {
  login,
  getAdminInfo,
  updatePassword,
  getAdminList,
  createAdmin,
  updateAdmin
};
