const { Op } = require('sequelize');
const moment = require('moment');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');

const getCouponList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    const now = new Date();

    const where = {
      status: 1,
      [Op.or]: [
        { total_count: 0 },
        { received_count: { [Op.lt]: db.Sequelize.col('total_count') } }
      ]
    };

    const { count, rows } = await db.Coupon.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取优惠券列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const receiveCoupon = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { coupon_id } = req.body;

    if (!coupon_id) {
      return error(res, '缺少优惠券ID', 400);
    }

    const coupon = await db.Coupon.findByPk(coupon_id, { transaction: t });

    if (!coupon || coupon.status !== 1) {
      await t.rollback();
      return error(res, '优惠券不存在或已下架', 400);
    }

    const now = new Date();
    if (coupon.valid_type === 1) {
      if (now < new Date(coupon.valid_start_date) || now > new Date(coupon.valid_end_date)) {
        await t.rollback();
        return error(res, '优惠券不在领取时间内', 400);
      }
    }

    if (coupon.total_count > 0 && coupon.received_count >= coupon.total_count) {
      await t.rollback();
      return error(res, '优惠券已被领完', 400);
    }

    if (coupon.is_new_user) {
      const hasOrder = await db.Order.count({ where: { user_id: userId }, transaction: t });
      if (hasOrder > 0) {
        await t.rollback();
        return error(res, '该优惠券仅限新用户领取', 400);
      }
    }

    const received = await db.UserCoupon.count({
      where: { user_id: userId, coupon_id },
      transaction: t
    });

    if (received > 0) {
      await t.rollback();
      return error(res, '您已领取过该优惠券', 400);
    }

    let validStartDate, validEndDate;
    if (coupon.valid_type === 1) {
      validStartDate = coupon.valid_start_date;
      validEndDate = coupon.valid_end_date;
    } else {
      validStartDate = moment().format('YYYY-MM-DD');
      validEndDate = moment().add(coupon.valid_days, 'days').format('YYYY-MM-DD');
    }

    await db.UserCoupon.create({
      user_id: userId,
      coupon_id,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      min_amount: coupon.min_amount,
      valid_start_date: validStartDate,
      valid_end_date: validEndDate,
      status: 0
    }, { transaction: t });

    await coupon.increment('received_count', { transaction: t });

    await t.commit();

    success(res, null, '领取成功');
  } catch (err) {
    await t.rollback();
    console.error('领取优惠券错误:', err);
    error(res, err.message || '领取失败', 500);
  }
};

const getUserCoupons = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { status = 0, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    const now = new Date();

    const where = { user_id: userId };

    if (parseInt(status) === 0) {
      where.status = 0;
      where.valid_end_date = { [Op.gte]: moment().format('YYYY-MM-DD') };
    } else if (parseInt(status) === 1) {
      where.status = 1;
    } else if (parseInt(status) === 2) {
      where[Op.or] = [
        { status: 2 },
        { status: 0, valid_end_date: { [Op.lt]: moment().format('YYYY-MM-DD') } }
      ];
    }

    const { count, rows } = await db.UserCoupon.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    const list = rows.map(item => {
      const data = item.toJSON();
      data.is_expired = data.status === 0 && new Date(data.valid_end_date) < now;
      return data;
    });

    paginate(res, list, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取用户优惠券错误:', err);
    error(res, '获取失败', 500);
  }
};

const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { amount, service_id } = req.query;
    const now = new Date();

    const coupons = await db.UserCoupon.findAll({
      where: {
        user_id: userId,
        status: 0,
        valid_end_date: { [Op.gte]: moment().format('YYYY-MM-DD') },
        min_amount: { [Op.lte]: parseFloat(amount) || 0 }
      },
      include: [{ model: db.Coupon, as: 'coupon' }],
      order: [['value', 'DESC']]
    });

    const list = coupons.filter(item => {
      const coupon = item.coupon;
      if (!coupon) return true;

      if (coupon.use_scope === 2 && service_id) {
        return coupon.scope_ids && coupon.scope_ids.includes(parseInt(service_id));
      }
      if (coupon.use_scope === 3 && service_id) {
        return coupon.scope_ids && coupon.scope_ids.includes(parseInt(service_id));
      }
      return true;
    }).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      value: item.value,
      min_amount: item.min_amount,
      valid_start_date: item.valid_start_date,
      valid_end_date: item.valid_end_date,
      description: item.coupon?.description
    }));

    success(res, list);
  } catch (err) {
    console.error('获取可用优惠券错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  getCouponList,
  receiveCoupon,
  getUserCoupons,
  getAvailableCoupons
};
