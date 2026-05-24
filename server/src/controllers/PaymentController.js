const db = require('../models');
const { success, error } = require('../utils/response');
const { generatePaymentNo } = require('../utils');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

const createPayment = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { order_id } = req.body;

    if (!order_id) {
      return error(res, '缺少订单ID', 400);
    }

    const order = await db.Order.findOne({
      where: { id: order_id, user_id: userId },
      include: [{ model: db.User, as: 'user' }],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.status >= 4) {
      await t.rollback();
      return error(res, '订单已完成，无需支付', 400);
    }

    if (order.pay_status === 1) {
      await t.rollback();
      return error(res, '订单已支付', 400);
    }

    if (order.pay_price <= 0) {
      await order.update({
        pay_status: 1,
        pay_time: new Date(),
        status: order.status === 0 ? 0 : order.status
      }, { transaction: t });
      await t.commit();
      return success(res, { paid: true, pay_price: 0 }, '支付成功');
    }

    const user = order.user;
    const payParams = await paymentService.createUnifiedOrder({
      ...order.toJSON(),
      user_openid: user.openid
    });

    const payment = await db.Payment.create({
      payment_no: payParams.paymentNo,
      order_id: order.id,
      user_id: userId,
      amount: order.pay_price,
      payment_type: 1,
      payment_scene: 1,
      status: 0,
      prepay_id: payParams.prepayId
    }, { transaction: t });

    await t.commit();

    success(res, {
      payment_id: payment.id,
      pay_params: {
        appId: payParams.appId,
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign
      },
      pay_price: order.pay_price
    }, '支付参数获取成功');
  } catch (err) {
    await t.rollback();
    console.error('创建支付错误:', err);
    error(res, err.message || '创建支付失败', 500);
  }
};

const payNotify = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const xmlData = req.body.toString();
    logger.info('收到微信支付通知:', xmlData);

    const notifyData = await paymentService.parseNotify(xmlData);

    if (notifyData.resultCode !== 'SUCCESS') {
      return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>');
    }

    const payment = await db.Payment.findOne({
      where: { payment_no: notifyData.outTradeNo },
      transaction: t
    });

    if (!payment) {
      return res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
    }

    if (payment.status === 1) {
      return res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
    }

    await payment.update({
      status: 1,
      transaction_id: notifyData.transactionId,
      paid_time: new Date()
    }, { transaction: t });

    const order = await db.Order.findByPk(payment.order_id, { transaction: t });
    if (order) {
      await order.update({
        pay_status: 1,
        pay_time: new Date()
      }, { transaction: t });

      if (order.worker_id) {
        await db.Notification.create({
          user_type: 2,
          user_id: order.worker_id,
          type: 'order_paid',
          title: '订单已支付',
          content: `订单${order.order_no}已支付，请准时上门`,
          order_id: order.id
        }, { transaction: t });
      }

      await db.Notification.create({
        user_type: 1,
        user_id: order.user_id,
        type: 'order_paid',
        title: '支付成功',
        content: `您的订单${order.order_no}支付成功`,
        order_id: order.id
      }, { transaction: t });
    }

    await t.commit();

    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
  } catch (err) {
    await t.rollback();
    logger.error('处理支付通知错误:', err);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>');
  }
};

const createExtraPayment = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { extra_id } = req.body;

    if (!extra_id) {
      return error(res, '缺少增项ID', 400);
    }

    const extra = await db.OrderExtra.findOne({
      where: { id: extra_id, user_confirm: 1 },
      include: [
        { model: db.Order, as: 'order', include: [{ model: db.User, as: 'user' }] }
      ],
      transaction: t
    });

    if (!extra) {
      await t.rollback();
      return error(res, '增项不存在或未确认', 404);
    }

    if (extra.order.user_id !== userId) {
      await t.rollback();
      return error(res, '无权限操作', 403);
    }

    const payParams = await paymentService.createUnifiedOrder({
      service_name: `增项：${extra.name}`,
      pay_price: extra.price * extra.quantity,
      user_openid: extra.order.user.openid
    });

    const payment = await db.Payment.create({
      payment_no: payParams.paymentNo,
      order_id: extra.order_id,
      user_id: userId,
      amount: extra.price * extra.quantity,
      payment_type: 1,
      payment_scene: 2,
      status: 0,
      prepay_id: payParams.prepayId
    }, { transaction: t });

    await t.commit();

    success(res, {
      payment_id: payment.id,
      pay_params: {
        appId: payParams.appId,
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign
      },
      pay_price: extra.price * extra.quantity
    }, '支付参数获取成功');
  } catch (err) {
    await t.rollback();
    console.error('创建增项支付错误:', err);
    error(res, err.message || '创建支付失败', 500);
  }
};

module.exports = {
  createPayment,
  payNotify,
  createExtraPayment
};
