const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');
const { calculateDistance } = require('../utils');
const config = require('../config');

const getOrderHall = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const worker = req.currentWorker;
    const { category_id, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {
      status: 0,
      pay_status: 1,
      worker_id: null
    };

    if (category_id) {
      where.category_id = parseInt(category_id);
    }

    if (worker.latitude && worker.longitude) {
      const radius = config.platform.serviceRadius;
      const lat = worker.latitude;
      const lon = worker.longitude;
      where[Op.and] = [
        db.Sequelize.literal(`JSON_EXTRACT(address_info, '$.latitude') BETWEEN ${lat - 0.15} AND ${lat + 0.15}`),
        db.Sequelize.literal(`JSON_EXTRACT(address_info, '$.longitude') BETWEEN ${lon - 0.15} AND ${lon + 0.15}`)
      ];
    }

    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'nickname', 'avatar'] },
        { model: db.Service, as: 'service', attributes: ['id', 'name', 'icon'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    const list = rows.map(order => {
      const data = order.toJSON();
      if (worker.latitude && worker.longitude && data.address_info) {
        const distance = calculateDistance(
          worker.latitude, worker.longitude,
          data.address_info.latitude, data.address_info.longitude,
          'km'
        );
        data.distance = distance.toFixed(1);
      }
      return data;
    });

    paginate(res, list, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取订单大厅错误:', err);
    error(res, '获取失败', 500);
  }
};

const acceptOrder = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const workerId = req.currentWorker.id;
    const worker = req.currentWorker;
    const { id } = req.params;

    const order = await db.Order.findByPk(id, { transaction: t });

    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.status !== 0) {
      await t.rollback();
      return error(res, '订单状态不支持接单', 400);
    }

    if (order.worker_id) {
      await t.rollback();
      return error(res, '订单已被其他人接单', 400);
    }

    if (!worker.is_accept_order) {
      await t.rollback();
      return error(res, '您已关闭接单功能', 400);
    }

    const currentOrderCount = await db.Order.count({
      where: {
        worker_id: workerId,
        status: { [Op.in]: [1, 2] }
      },
      transaction: t
    });

    if (currentOrderCount >= 5) {
      await t.rollback();
      return error(res, '您的待服务订单过多，请先完成现有订单', 400);
    }

    await order.update({
      worker_id: workerId,
      status: 1,
      accept_time: new Date()
    }, { transaction: t });

    await db.Notification.create({
      user_type: 1,
      user_id: order.user_id,
      type: 'order_accepted',
      title: '订单已被接单',
      content: `您的订单${order.order_no}已被${worker.name || '师傅'}接单`,
      order_id: order.id
    }, { transaction: t });

    await t.commit();

    success(res, null, '接单成功');
  } catch (err) {
    await t.rollback();
    console.error('接单错误:', err);
    error(res, err.message || '接单失败', 500);
  }
};

const getMyOrders = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { worker_id: workerId };
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }

    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'phone'] },
        { model: db.Service, as: 'service', attributes: ['id', 'name', 'icon'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取我的订单错误:', err);
    error(res, '获取失败', 500);
  }
};

const getWorkerOrderDetail = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { id } = req.params;

    const order = await db.Order.findOne({
      where: { id, worker_id: workerId },
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'phone'] },
        { model: db.Service, as: 'service', attributes: ['id', 'name', 'icon', 'description'] },
        { model: db.OrderExtra, as: 'extras' },
        { model: db.OrderPhoto, as: 'photos' },
        { model: db.Evaluation, as: 'evaluation' }
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

const updateOrderStatus = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const workerId = req.currentWorker.id;
    const { id } = req.params;
    const { action } = req.body;

    const order = await db.Order.findOne({
      where: { id, worker_id: workerId },
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    const statusMap = {
      arrive: { status: 2, time: 'arrive_time', title: '师傅已到达', content: '师傅已到达服务地点' },
      start: { status: 2, time: 'start_time', title: '服务已开始', content: '师傅已开始服务' },
      finish: { status: 3, time: 'finish_time', title: '服务已完成', content: '师傅已完成服务，请确认' }
    };

    const statusConfig = statusMap[action];
    if (!statusConfig) {
      await t.rollback();
      return error(res, '无效的操作', 400);
    }

    if ((action === 'arrive' && order.status !== 1) ||
        (action === 'start' && order.status !== 2) ||
        (action === 'finish' && order.status !== 2)) {
      await t.rollback();
      return error(res, '订单状态不支持该操作', 400);
    }

    const updateData = { status: statusConfig.status };
    updateData[statusConfig.time] = new Date();
    await order.update(updateData, { transaction: t });

    await db.Notification.create({
      user_type: 1,
      user_id: order.user_id,
      type: `order_${action}`,
      title: statusConfig.title,
      content: statusConfig.content,
      order_id: order.id
    }, { transaction: t });

    await t.commit();

    success(res, null, '操作成功');
  } catch (err) {
    await t.rollback();
    console.error('更新订单状态错误:', err);
    error(res, err.message || '操作失败', 500);
  }
};

const addOrderExtra = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const workerId = req.currentWorker.id;
    const { order_id, name, description, price, quantity = 1, images } = req.body;

    if (!order_id || !name || !price) {
      return error(res, '缺少必要参数', 400);
    }

    const order = await db.Order.findOne({
      where: { id: order_id, worker_id: workerId },
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.status !== 2) {
      await t.rollback();
      return error(res, '只有服务中的订单可以添加增项', 400);
    }

    const extra = await db.OrderExtra.create({
      order_id,
      worker_id: workerId,
      name,
      description,
      price,
      quantity,
      images,
      user_confirm: 0
    }, { transaction: t });

    await order.update({ is_extra: 1 }, { transaction: t });

    await db.Notification.create({
      user_type: 1,
      user_id: order.user_id,
      type: 'order_extra',
      title: '订单增项待确认',
      content: `师傅提出增项：${name}，金额${price}元，请确认`,
      order_id: order.id
    }, { transaction: t });

    await t.commit();

    success(res, { id: extra.id }, '增项已提交，等待用户确认');
  } catch (err) {
    await t.rollback();
    console.error('添加增项错误:', err);
    error(res, err.message || '添加失败', 500);
  }
};

const confirmExtra = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { extra_id, confirm } = req.body;

    if (!extra_id || confirm === undefined) {
      return error(res, '缺少必要参数', 400);
    }

    const extra = await db.OrderExtra.findByPk(extra_id, {
      include: [{ model: db.Order, as: 'order' }],
      transaction: t
    });

    if (!extra) {
      await t.rollback();
      return error(res, '增项不存在', 404);
    }

    if (extra.order.user_id !== userId) {
      await t.rollback();
      return error(res, '无权限操作', 403);
    }

    if (extra.user_confirm !== 0) {
      await t.rollback();
      return error(res, '增项已处理', 400);
    }

    const confirmStatus = confirm ? 1 : 2;
    await extra.update({
      user_confirm: confirmStatus,
      confirm_time: new Date()
    }, { transaction: t });

    if (confirm) {
      const extraPrice = extra.price * extra.quantity;
      const platformFee = extraPrice * (extra.order.platform_fee_rate / 100);
      await extra.order.update({
        extra_price: db.Sequelize.literal(`extra_price + ${extraPrice}`),
        total_price: db.Sequelize.literal(`total_price + ${extraPrice}`),
        pay_price: db.Sequelize.literal(`pay_price + ${extraPrice}`),
        worker_price: db.Sequelize.literal(`worker_price + ${extraPrice - platformFee}`),
        platform_fee: db.Sequelize.literal(`platform_fee + ${platformFee}`)
      }, { transaction: t });

      await db.Notification.create({
        user_type: 2,
        user_id: extra.worker_id,
        type: 'extra_confirmed',
        title: '增项已确认',
        content: `用户已确认增项：${extra.name}`,
        order_id: extra.order_id
      }, { transaction: t });
    } else {
      await db.Notification.create({
        user_type: 2,
        user_id: extra.worker_id,
        type: 'extra_rejected',
        title: '增项被拒绝',
        content: `用户拒绝了增项：${extra.name}`,
        order_id: extra.order_id
      }, { transaction: t });
    }

    await t.commit();

    success(res, null, confirm ? '确认成功' : '已拒绝');
  } catch (err) {
    await t.rollback();
    console.error('确认增项错误:', err);
    error(res, err.message || '操作失败', 500);
  }
};

const uploadOrderPhoto = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { order_id, type, description } = req.body;
    const file = req.file;

    if (!order_id || !type || !file) {
      return error(res, '缺少必要参数', 400);
    }

    const order = await db.Order.findOne({
      where: { id: order_id, worker_id: workerId }
    });

    if (!order) {
      return error(res, '订单不存在', 404);
    }

    const imageUrl = require('../middleware/upload').getFileUrl(req, file.path);

    const photo = await db.OrderPhoto.create({
      order_id,
      type: parseInt(type),
      image_url: imageUrl,
      description,
      uploader_id: workerId,
      uploader_type: 2
    });

    success(res, { id: photo.id, image_url: imageUrl }, '上传成功');
  } catch (err) {
    console.error('上传照片错误:', err);
    error(res, '上传失败', 500);
  }
};

const getOrderExtras = async (req, res) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return error(res, '缺少订单ID', 400);
    }

    const extras = await db.OrderExtra.findAll({
      where: { order_id },
      order: [['created_at', 'DESC']]
    });

    success(res, extras);
  } catch (err) {
    console.error('获取增项列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const getOrderPhotos = async (req, res) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return error(res, '缺少订单ID', 400);
    }

    const photos = await db.OrderPhoto.findAll({
      where: { order_id },
      order: [['type', 'ASC'], ['created_at', 'DESC']]
    });

    success(res, photos);
  } catch (err) {
    console.error('获取照片列表错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  getOrderHall,
  acceptOrder,
  getMyOrders,
  getWorkerOrderDetail,
  updateOrderStatus,
  addOrderExtra,
  confirmExtra,
  uploadOrderPhoto,
  getOrderExtras,
  getOrderPhotos
};
