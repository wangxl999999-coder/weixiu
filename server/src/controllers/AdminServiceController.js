const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');

const getCategoryList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await db.Category.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取分类列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const createCategory = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { name, icon, description, sort_order, is_hot } = req.body;

    if (!name) {
      return error(res, '请输入分类名称', 400);
    }

    const category = await db.Category.create({
      name,
      icon,
      description,
      sort_order: sort_order || 0,
      is_hot: is_hot || 0,
      status: 1
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'service',
      action: 'create_category',
      target_id: category.id,
      content: `创建分类：${name}`
    }, { transaction: t });

    await t.commit();

    success(res, { id: category.id }, '创建成功');
  } catch (err) {
    await t.rollback();
    console.error('创建分类错误:', err);
    error(res, err.message || '创建失败', 500);
  }
};

const updateCategory = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const { name, icon, description, sort_order, is_hot, status } = req.body;

    const category = await db.Category.findByPk(id, { transaction: t });
    if (!category) {
      await t.rollback();
      return error(res, '分类不存在', 404);
    }

    await category.update({
      name, icon, description, sort_order, is_hot, status
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'service',
      action: 'update_category',
      target_id: id,
      content: `更新分类：${name}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '更新成功');
  } catch (err) {
    await t.rollback();
    console.error('更新分类错误:', err);
    error(res, err.message || '更新失败', 500);
  }
};

const getServiceList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category_id, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (category_id) where.category_id = parseInt(category_id);
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await db.Service.findAndCountAll({
      where,
      include: [
        { model: db.Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取服务列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const getServiceDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await db.Service.findByPk(id, {
      include: [
        { model: db.Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    if (!service) {
      return error(res, '服务不存在', 404);
    }

    success(res, service);
  } catch (err) {
    console.error('获取服务详情错误:', err);
    error(res, '获取失败', 500);
  }
};

const createService = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const {
      category_id, name, icon, images, description,
      base_price, price_type, unit, content,
      service_process, notice, sort_order
    } = req.body;

    if (!category_id || !name || !base_price) {
      return error(res, '缺少必要参数', 400);
    }

    const service = await db.Service.create({
      category_id, name, icon, images, description,
      base_price, price_type: price_type || 1, unit: unit || '次',
      content, service_process, notice,
      sort_order: sort_order || 0,
      status: 1
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'service',
      action: 'create_service',
      target_id: service.id,
      content: `创建服务：${name}`
    }, { transaction: t });

    await t.commit();

    success(res, { id: service.id }, '创建成功');
  } catch (err) {
    await t.rollback();
    console.error('创建服务错误:', err);
    error(res, err.message || '创建失败', 500);
  }
};

const updateService = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const {
      category_id, name, icon, images, description,
      base_price, price_type, unit, content,
      service_process, notice, sort_order, status
    } = req.body;

    const service = await db.Service.findByPk(id, { transaction: t });
    if (!service) {
      await t.rollback();
      return error(res, '服务不存在', 404);
    }

    await service.update({
      category_id, name, icon, images, description,
      base_price, price_type, unit, content,
      service_process, notice, sort_order, status
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'service',
      action: 'update_service',
      target_id: id,
      content: `更新服务：${name}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '更新成功');
  } catch (err) {
    await t.rollback();
    console.error('更新服务错误:', err);
    error(res, err.message || '更新失败', 500);
  }
};

const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const service = await db.Service.findByPk(id);
    if (!service) {
      return error(res, '服务不存在', 404);
    }

    await service.update({ status: parseInt(status) });

    success(res, null, '状态更新成功');
  } catch (err) {
    console.error('更新服务状态错误:', err);
    error(res, '更新失败', 500);
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await db.Category.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']]
    });

    success(res, categories);
  } catch (err) {
    console.error('获取所有分类错误:', err);
    error(res, '获取失败', 500);
  }
};

const deleteCategory = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;

    const category = await db.Category.findByPk(id, { transaction: t });
    if (!category) {
      await t.rollback();
      return error(res, '分类不存在', 404);
    }

    const serviceCount = await db.Service.count({
      where: { category_id: id },
      transaction: t
    });
    if (serviceCount > 0) {
      await t.rollback();
      return error(res, '该分类下还有服务，无法删除', 400);
    }

    await category.destroy({ transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'service',
      action: 'delete_category',
      target_id: id,
      content: `删除分类：${category.name}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '删除成功');
  } catch (err) {
    await t.rollback();
    console.error('删除分类错误:', err);
    error(res, err.message || '删除失败', 500);
  }
};

const deleteService = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;

    const service = await db.Service.findByPk(id, { transaction: t });
    if (!service) {
      await t.rollback();
      return error(res, '服务不存在', 404);
    }

    const orderCount = await db.Order.count({
      where: { service_id: id },
      transaction: t
    });
    if (orderCount > 0) {
      await t.rollback();
      return error(res, '该服务已有订单，无法删除', 400);
    }

    await service.destroy({ transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'service',
      action: 'delete_service',
      target_id: id,
      content: `删除服务：${service.name}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '删除成功');
  } catch (err) {
    await t.rollback();
    console.error('删除服务错误:', err);
    error(res, err.message || '删除失败', 500);
  }
};

module.exports = {
  getCategoryList,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getServiceList,
  getServiceDetail,
  createService,
  updateService,
  updateServiceStatus,
  deleteService
};
