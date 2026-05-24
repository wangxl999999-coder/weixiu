const { Op, Transaction } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');
const { generateOrderNo, generatePaymentNo, calculateDistance } = require('../utils');
const paymentService = require('../services/paymentService');
const config = require('../config');

const createOrder = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const {
      service_id, address_id, appointment_time, quantity = 1,
      remark, coupon_id, worker_id, flash_sale_id
    } = req.body;

    if (!service_id || !address_id || !appointment_time) {
      return error(res, '缺少必要参数', 400);
    }

    const service = await db.Service.findByPk(service_id);
    if (!service || service.status !== 1) {
      return error(res, '服务不存在或已下架', 400);
    }

    const address = await db.UserAddress.findOne({
      where: { id: address_id, user_id: userId }
    });
    if (!address) {
      return error(res, '地址不存在', 400);
    }

    let basePrice = service.base_price;
    let serviceName = service.name;
    let serviceImage = service.icon;
    let discountAmount = 0;

    if (flash_sale_id) {
      const flashSale = await db.FlashSale.findByPk(flash_sale_id);
      if (flashSale && flashSale.status === 1 &&
          new Date() >= new Date(flashSale.start_time) &&
          new Date() <= new Date(flashSale.end_time) &&
          flashSale.sold_count < flashSale.total_count) {
        basePrice = flashSale.flash_price;
        serviceName = flashSale.service_name;
        serviceImage = flashSale.service_image;
      }
    }

    let userCoupon = null;
    if (coupon_id) {
      userCoupon = await db.UserCoupon.findOne({
        where: { id: coupon_id, user_id: userId, status: 0 },
        include: [{ model: db.Coupon, as: 'coupon' }]
      });

      if (!userCoupon) {
        return error(res, '优惠券不存在或已使用', 400);
      }

      const totalAmount = basePrice * quantity;
      const coupon = userCoupon.coupon;
      const today = new Date();

      if (today < new Date(userCoupon.valid_start_date) ||
          today > new Date(userCoupon.valid_end_date)) {
        return error(res, '优惠券不在有效期内', 400);
      }

      if (totalAmount < coupon.min_amount) {
        return error(res, `订单金额需满${coupon.min_amount}元才可使用`, 400);
      }

      switch (coupon.type) {
        case 1:
          discountAmount = coupon.value;
          break;
        case 2:
          discountAmount = totalAmount * (1 - coupon.value / 100);
          if (coupon.discount_limit && discountAmount > coupon.discount_limit) {
            discountAmount = coupon.discount_limit;
          }
          break;
        case 3:
          discountAmount = coupon.value;
          break;
      }

      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }
    }

    const totalPrice = Math.max(0, (basePrice * quantity) - discountAmount);
    const platformFeeRate = config.platform.defaultFeeRate;
    const platformFee = totalPrice * (platformFeeRate / 100);
    const workerPrice = totalPrice - platformFee;

    const orderNo = generateOrderNo();

    const order = await db.Order.create({
      order_no: orderNo,
      user_id: userId,
      worker_id: worker_id || null,
      service_id,
      service_name: serviceName,
      service_image: serviceImage,
      category_id: service.category_id,
      address_id,
      address_info: {
        name: address.name,
        phone: address.phone,
        province: address.province,
        city: address.city,
        district: address.district,
        address: address.address,
        house_number: address.house_number,
        latitude: address.latitude,
        longitude: address.longitude
      },
      appointment_time,
      quantity,
      base_price: basePrice,
      discount_amount: discountAmount,
      coupon_id,
      total_price: totalPrice,
      pay_price: totalPrice,
      worker_price: workerPrice,
      platform_fee: platformFee,
      platform_fee_rate: platformFeeRate,
      remark,
      status: 0,
      pay_status: 0,
      dispatch_type: worker_id ? 1 : 0,
      is_extra: 0
    }, { transaction: t });

    if (userCoupon) {
      await userCoupon.update({
        status: 1,
        order_id: order.id,
        used_time: new Date()
      }, { transaction: t });

      await db.Coupon.increment('used_count', {
        where: { id: userCoupon.coupon_id },
        transaction: t
      });
    }

    if (flash_sale_id) {
      await db.FlashSale.increment('sold_count', {
        where: { id: flash_sale_id },
        transaction: t
      });
    }

    await db.Notification.create({
      user_type: 1,
      user_id: userId,
      type: 'order_created',
      title: '订单创建成功',
      content: `您的${serviceName}订单已创建成功，请及时支付`,
      order_id: order.id
    }, { transaction: t });

    await t.commit();

    success(res, {
      order_id: order.id,
      order_no: order.order_no,
      total_price: order.total_price,
      pay_price: order.pay_price
    }, '订单创建成功');
  } catch (err) {
    await t.rollback();
    console.error('创建订单错误:', err);
    error(res, err.message || '创建订单失败', 500);
  }
};

const getOrderList = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { user_id: userId };
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }

    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'avatar', 'phone'] },
        { model: db.Service, as: 'service', attributes: ['id', 'name', 'icon'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取订单列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;

    const order = await db.Order.findOne({
      where: { id, user_id: userId },
      include: [
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'avatar', 'phone', 'rating'] },
        { model: db.Service, as: 'service', attributes: ['id', 'name', 'icon', 'description'] },
        { model: db.OrderExtra, as: 'extras' },
        { model: db.OrderPhoto, as: 'photos' },
        { model: db.Evaluation, as: 'evaluation' },
        { model: db.Complaint, as: 'complaint' }
      ]
    });

    if (!order) {
      return error(res, '订单不存在', 404);
    }

    success(res, order);
  } catch (err) {
    console.error('获取订单详情错误:', err);
    error(res, '获取失败', 500);
  }
};

const cancelOrder = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;
    const { reason } = req.body;

    const order = await db.Order.findOne({
      where: { id, user_id: userId },
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.status > 1) {
      await t.rollback();
      return error(res, '当前订单状态不支持取消', 400);
    }

    await order.update({
      status: 5,
      cancel_time: new Date(),
      cancel_reason: reason
    }, { transaction: t });

    if (order.pay_status === 1) {
      await order.update({
        pay_status: 2,
        refund_status: 2,
        refund_amount: order.pay_price
      }, { transaction: t });

      await db.FinancialRecord.create({
        record_no: require('../utils').generateRecordNo(),
        worker_id: order.worker_id,
        order_id: order.id,
        type: 2,
        amount: -order.worker_price,
        balance_after: 0,
        description: `订单取消退款，订单号：${order.order_no}`
      }, { transaction: t });
    }

    if (order.coupon_id) {
      await db.UserCoupon.update(
        { status: 0, order_id: null, used_time: null },
        { where: { id: order.coupon_id }, transaction: t }
      );
    }

    if (order.worker_id) {
      await db.Notification.create({
        user_type: 2,
        user_id: order.worker_id,
        type: 'order_cancelled',
        title: '订单已取消',
        content: `订单${order.order_no}已被用户取消`,
        order_id: order.id
      }, { transaction: t });
    }

    await t.commit();

    success(res, null, '订单取消成功');
  } catch (err) {
    await t.rollback();
    console.error('取消订单错误:', err);
    error(res, err.message || '取消失败', 500);
  }
};

const confirmOrder = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;

    const order = await db.Order.findOne({
      where: { id, user_id: userId },
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.status !== 3) {
      await t.rollback();
      return error(res, '当前订单状态不支持确认', 400);
    }

    await order.update({
      status: 4,
      confirm_time: new Date()
    }, { transaction: t });

    if (order.worker_id) {
      const wallet = await db.WorkerWallet.findOne({
        where: { worker_id: order.worker_id },
        transaction: t
      });

      const newBalance = parseFloat(wallet.balance) + parseFloat(order.worker_price);
      await wallet.update({
        balance: newBalance,
        total_income: parseFloat(wallet.total_income) + parseFloat(order.worker_price)
      }, { transaction: t });

      await db.FinancialRecord.create({
        record_no: require('../utils').generateRecordNo(),
        worker_id: order.worker_id,
        order_id: order.id,
        type: 1,
        amount: order.worker_price,
        balance_after: newBalance,
        description: `订单完成收入，订单号：${order.order_no}`
      }, { transaction: t });

      await db.Worker.increment('order_count', {
        where: { id: order.worker_id },
        transaction: t
      });

      await db.Notification.create({
        user_type: 2,
        user_id: order.worker_id,
        type: 'order_completed',
        title: '订单已完成',
        content: `订单${order.order_no}已确认完成，收入已到账`,
        order_id: order.id
      }, { transaction: t });
    }

    await db.Notification.create({
      user_type: 1,
      user_id: userId,
      type: 'order_completed',
      title: '订单已完成',
      content: `您的订单${order.order_no}已确认完成`,
      order_id: order.id
    }, { transaction: t });

    await t.commit();

    success(res, null, '订单确认成功');
  } catch (err) {
    await t.rollback();
    console.error('确认订单错误:', err);
    error(res, err.message || '确认失败', 500);
  }
};

const getOrderStatusCount = async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const counts = await Promise.all([
      db.Order.count({ where: { user_id: userId, status: 0 } }),
      db.Order.count({ where: { user_id: userId, status: { [Op.in]: [1, 2] } } }),
      db.Order.count({ where: { user_id: userId, status: 3 } }),
      db.Order.count({ where: { user_id: userId, status: 4, is_evaluated: 0 } })
    ]);

    success(res, {
      pending_accept: counts[0],
      in_service: counts[1],
      pending_confirm: counts[2],
      pending_evaluate: counts[3]
    });
  } catch (err) {
    console.error('获取订单状态统计错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  createOrder,
  getOrderList,
  getOrderDetail,
  cancelOrder,
  confirmOrder,
  getOrderStatusCount
};
