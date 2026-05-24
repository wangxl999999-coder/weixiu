const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');
const { generateCouponCode } = require('../utils');

const getCouponList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, type, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (type) where.type = parseInt(type);
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await db.Coupon.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    const list = await Promise.all(rows.map(async (coupon) => {
      const received = await db.UserCoupon.count({ where: { coupon_id: coupon.id } });
      const used = await db.UserCoupon.count({ where: { coupon_id: coupon.id, status: 2 } });
      return {
        ...coupon.toJSON(),
        received_count: received,
        used_count: used
      };
    }));

    paginate(res, list, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取优惠券列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const createCoupon = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const {
      name, type, value, min_amount, total_count,
      per_user_limit, start_date, end_date,
      category_ids, is_new_user_only, description
    } = req.body;

    if (!name || !type || !value || !min_amount || !total_count || !start_date || !end_date) {
      return error(res, '缺少必要参数', 400);
    }

    if (new Date(end_date) <= new Date(start_date)) {
      await t.rollback();
      return error(res, '结束时间必须晚于开始时间', 400);
    }

    const coupon = await db.Coupon.create({
      name,
      coupon_code: generateCouponCode(),
      type: parseInt(type),
      value: parseFloat(value),
      min_amount: parseFloat(min_amount),
      total_count: parseInt(total_count),
      remain_count: parseInt(total_count),
      per_user_limit: per_user_limit || 1,
      start_date,
      end_date,
      category_ids,
      is_new_user_only: is_new_user_only || 0,
      description,
      status: 1
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'marketing',
      action: 'create_coupon',
      target_id: coupon.id,
      content: `创建优惠券：${name}`
    }, { transaction: t });

    await t.commit();

    success(res, { id: coupon.id, coupon_code: coupon.coupon_code }, '创建成功');
  } catch (err) {
    await t.rollback();
    console.error('创建优惠券错误:', err);
    error(res, err.message || '创建失败', 500);
  }
};

const updateCoupon = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const {
      name, type, value, min_amount, total_count,
      per_user_limit, start_date, end_date,
      category_ids, is_new_user_only, description, status
    } = req.body;

    const coupon = await db.Coupon.findByPk(id, { transaction: t });
    if (!coupon) {
      await t.rollback();
      return error(res, '优惠券不存在', 404);
    }

    const receivedCount = await db.UserCoupon.count({
      where: { coupon_id: id },
      transaction: t
    });
    if (total_count && parseInt(total_count) < receivedCount) {
      await t.rollback();
      return error(res, '总发放量不能小于已领取数量', 400);
    }

    await coupon.update({
      name, type, value, min_amount,
      total_count,
      remain_count: total_count ? parseInt(total_count) - receivedCount : coupon.remain_count,
      per_user_limit, start_date, end_date,
      category_ids, is_new_user_only, description, status
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'marketing',
      action: 'update_coupon',
      target_id: id,
      content: `更新优惠券：${name}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '更新成功');
  } catch (err) {
    await t.rollback();
    console.error('更新优惠券错误:', err);
    error(res, err.message || '更新失败', 500);
  }
};

const deleteCoupon = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;

    const coupon = await db.Coupon.findByPk(id, { transaction: t });
    if (!coupon) {
      await t.rollback();
      return error(res, '优惠券不存在', 404);
    }

    const usedCount = await db.UserCoupon.count({
      where: { coupon_id: id, status: 2 },
      transaction: t
    });
    if (usedCount > 0) {
      await t.rollback();
      return error(res, '该优惠券已有使用记录，无法删除', 400);
    }

    await db.UserCoupon.destroy({ where: { coupon_id: id }, transaction: t });
    await coupon.destroy({ transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'marketing',
      action: 'delete_coupon',
      target_id: id,
      content: `删除优惠券：${coupon.name}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '删除成功');
  } catch (err) {
    await t.rollback();
    console.error('删除优惠券错误:', err);
    error(res, err.message || '删除失败', 500);
  }
};

const getFlashSaleList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await db.FlashSale.findAndCountAll({
      where,
      include: [
        { model: db.Service, as: 'service', attributes: ['id', 'name', 'icon', 'base_price'] }
      ],
      order: [['start_time', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取秒杀列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const createFlashSale = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const {
      service_id, name, image, sale_price, original_price,
      total_count, start_time, end_time, sort_order
    } = req.body;

    if (!service_id || !sale_price || !total_count || !start_time || !end_time) {
      return error(res, '缺少必要参数', 400);
    }

    const service = await db.Service.findByPk(service_id, { transaction: t });
    if (!service) {
      await t.rollback();
      return error(res, '服务不存在', 404);
    }

    const flashSale = await db.FlashSale.create({
      service_id,
      name: name || service.name,
      image: image || service.icon,
      sale_price,
      original_price: original_price || service.base_price,
      total_count,
      remain_count: total_count,
      start_time,
      end_time,
      sort_order: sort_order || 0,
      status: 1
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'marketing',
      action: 'create_flash_sale',
      target_id: flashSale.id,
      content: `创建秒杀活动：${name || service.name}`
    }, { transaction: t });

    await t.commit();

    success(res, { id: flashSale.id }, '创建成功');
  } catch (err) {
    await t.rollback();
    console.error('创建秒杀错误:', err);
    error(res, err.message || '创建失败', 500);
  }
};

const updateFlashSale = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const {
      name, image, sale_price, original_price,
      total_count, start_time, end_time, sort_order, status
    } = req.body;

    const flashSale = await db.FlashSale.findByPk(id, { transaction: t });
    if (!flashSale) {
      await t.rollback();
      return error(res, '秒杀活动不存在', 404);
    }

    const soldCount = flashSale.total_count - flashSale.remain_count;
    if (total_count && parseInt(total_count) < soldCount) {
      await t.rollback();
      return error(res, '总数量不能小于已售出数量', 400);
    }

    await flashSale.update({
      name, image, sale_price, original_price,
      total_count,
      remain_count: total_count ? parseInt(total_count) - soldCount : flashSale.remain_count,
      start_time, end_time, sort_order, status
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'marketing',
      action: 'update_flash_sale',
      target_id: id,
      content: `更新秒杀活动`
    }, { transaction: t });

    await t.commit();

    success(res, null, '更新成功');
  } catch (err) {
    await t.rollback();
    console.error('更新秒杀错误:', err);
    error(res, err.message || '更新失败', 500);
  }
};

const deleteFlashSale = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;

    const flashSale = await db.FlashSale.findByPk(id, { transaction: t });
    if (!flashSale) {
      await t.rollback();
      return error(res, '秒杀活动不存在', 404);
    }

    const soldCount = flashSale.total_count - flashSale.remain_count;
    if (soldCount > 0) {
      await t.rollback();
      return error(res, '该活动已有销售记录，无法删除', 400);
    }

    await flashSale.destroy({ transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'marketing',
      action: 'delete_flash_sale',
      target_id: id,
      content: `删除秒杀活动：${flashSale.name}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '删除成功');
  } catch (err) {
    await t.rollback();
    console.error('删除秒杀错误:', err);
    error(res, err.message || '删除失败', 500);
  }
};

const getUserCouponList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, coupon_id, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (coupon_id) where.coupon_id = coupon_id;
    if (status) where.status = parseInt(status);

    const { count, rows } = await db.UserCoupon.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
        { model: db.Coupon, as: 'coupon', attributes: ['id', 'name', 'value'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取用户优惠券列表错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  getCouponList,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getFlashSaleList,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  getUserCouponList
};
