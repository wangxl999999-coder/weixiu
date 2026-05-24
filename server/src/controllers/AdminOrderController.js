const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');

const getOrderList = async (req, res) => {
  try {
    const {
      page = 1, pageSize = 10, status, keyword,
      start_date, end_date, worker_id, user_id
    } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (worker_id) where.worker_id = worker_id;
    if (user_id) where.user_id = user_id;
    if (keyword) {
      where[Op.or] = [
        { order_no: { [Op.like]: `%${keyword}%` } },
        { service_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, `${end_date} 23:59:59`] };
    }

    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'phone'] },
        { model: db.Service, as: 'service', attributes: ['id', 'name'] }
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

const getAdminOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.Order.findByPk(id, {
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'nickname', 'phone', 'avatar'] },
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'phone', 'avatar'] },
        { model: db.Service, as: 'service', attributes: ['id', 'name', 'icon', 'base_price'] },
        { model: db.OrderExtra, as: 'extras' },
        { model: db.OrderPhoto, as: 'photos' },
        { model: db.Payment, as: 'payments' },
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

const dispatchOrder = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const { worker_id } = req.body;

    if (!worker_id) {
      return error(res, '请选择师傅', 400);
    }

    const order = await db.Order.findByPk(id, { transaction: t });
    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.status !== 0) {
      await t.rollback();
      return error(res, '只有待接单状态的订单可以派单', 400);
    }

    const worker = await db.Worker.findByPk(worker_id, { transaction: t });
    if (!worker || worker.audit_status !== 1 || worker.status !== 1 || !worker.is_accept_order) {
      await t.rollback();
      return error(res, '该师傅当前无法接单', 400);
    }

    await order.update({
      worker_id,
      status: 1,
      accept_time: new Date(),
      dispatch_type: 1,
      dispatch_admin_id: adminId
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'order',
      action: 'dispatch',
      target_id: id,
      content: `派单给师傅：${worker.name}`
    }, { transaction: t });

    await db.Notification.create({
      user_type: 2,
      user_id: worker_id,
      type: 'order_dispatched',
      title: '收到新的派单',
      content: `您收到管理员派单：${order.service_name}`,
      order_id: id
    }, { transaction: t });

    await db.Notification.create({
      user_type: 1,
      user_id: order.user_id,
      type: 'order_accepted',
      title: '订单已被接单',
      content: `您的订单${order.order_no}已被${worker.name}接单`,
      order_id: id
    }, { transaction: t });

    await t.commit();

    success(res, null, '派单成功');
  } catch (err) {
    await t.rollback();
    console.error('派单错误:', err);
    error(res, err.message || '派单失败', 500);
  }
};

const reassignOrder = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const { worker_id, reason } = req.body;

    if (!worker_id) {
      return error(res, '请选择新师傅', 400);
    }

    const order = await db.Order.findByPk(id, { transaction: t });
    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.status >= 4) {
      await t.rollback();
      return error(res, '已完成的订单无法改派', 400);
    }

    const oldWorkerId = order.worker_id;
    const newWorker = await db.Worker.findByPk(worker_id, { transaction: t });
    if (!newWorker || newWorker.audit_status !== 1 || newWorker.status !== 1 || !newWorker.is_accept_order) {
      await t.rollback();
      return error(res, '该师傅当前无法接单', 400);
    }

    await order.update({
      worker_id,
      accept_time: new Date(),
      dispatch_type: 1,
      dispatch_admin_id: adminId
    }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'order',
      action: 'reassign',
      target_id: id,
      content: `改派订单，原因：${reason || ''}`
    }, { transaction: t });

    if (oldWorkerId) {
      await db.Notification.create({
        user_type: 2,
        user_id: oldWorkerId,
        type: 'order_reassigned',
        title: '订单已被改派',
        content: `订单${order.order_no}已被管理员改派给其他师傅`,
        order_id: id
      }, { transaction: t });
    }

    await db.Notification.create({
      user_type: 2,
      user_id: worker_id,
      type: 'order_dispatched',
      title: '收到新的派单',
      content: `您收到管理员派单：${order.service_name}`,
      order_id: id
    }, { transaction: t });

    await t.commit();

    success(res, null, '改派成功');
  } catch (err) {
    await t.rollback();
    console.error('改派错误:', err);
    error(res, err.message || '改派失败', 500);
  }
};

const handleRefund = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const { action, amount, reason } = req.body;

    if (!action) {
      return error(res, '请选择处理方式', 400);
    }

    const order = await db.Order.findByPk(id, { transaction: t });
    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.refund_status !== 1) {
      await t.rollback();
      return error(res, '该订单没有退款申请', 400);
    }

    if (action === 1) {
      const refundAmount = amount || order.pay_price;
      if (parseFloat(refundAmount) > parseFloat(order.pay_price)) {
        await t.rollback();
        return error(res, '退款金额不能大于实付金额', 400);
      }

      await order.update({
        refund_status: 2,
        refund_amount: refundAmount,
        pay_status: 2,
        status: 6
      }, { transaction: t });

      if (order.worker_id) {
        const wallet = await db.WorkerWallet.findOne({
          where: { worker_id: order.worker_id },
          transaction: t
        });
        const workerRefund = order.worker_price * (refundAmount / order.pay_price);
        await wallet.update({
          balance: db.Sequelize.literal(`balance - ${workerRefund}`)
        }, { transaction: t });

        await db.FinancialRecord.create({
          record_no: require('../utils').generateRecordNo(),
          worker_id: order.worker_id,
          order_id: id,
          type: 2,
          amount: -workerRefund,
          balance_after: parseFloat(wallet.balance) - parseFloat(workerRefund),
          description: `订单退款，订单号：${order.order_no}`
        }, { transaction: t });
      }

      await db.Notification.create({
        user_type: 1,
        user_id: order.user_id,
        type: 'refund_approved',
        title: '退款申请已通过',
        content: `您的退款申请已通过，退款金额：${refundAmount}元`,
        order_id: id
      }, { transaction: t });
    } else {
      await order.update({
        refund_status: 3,
        refund_reason: reason
      }, { transaction: t });

      await db.Notification.create({
        user_type: 1,
        user_id: order.user_id,
        type: 'refund_rejected',
        title: '退款申请被拒绝',
        content: `您的退款申请被拒绝：${reason}`,
        order_id: id
      }, { transaction: t });
    }

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'order',
      action: 'refund',
      target_id: id,
      content: `处理退款申请，结果：${action === 1 ? '通过' : '拒绝'}`
    }, { transaction: t });

    await t.commit();

    success(res, null, action === 1 ? '退款已通过' : '已拒绝退款');
  } catch (err) {
    await t.rollback();
    console.error('处理退款错误:', err);
    error(res, err.message || '处理失败', 500);
  }
};

const handleComplaint = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const { action, result } = req.body;

    if (!action || !result) {
      return error(res, '缺少必要参数', 400);
    }

    const complaint = await db.Complaint.findByPk(id, { transaction: t });
    if (!complaint) {
      await t.rollback();
      return error(res, '投诉不存在', 404);
    }

    if (complaint.status !== 0 && complaint.status !== 1) {
      await t.rollback();
      return error(res, '该投诉已处理', 400);
    }

    await complaint.update({
      status: parseInt(action) === 2 ? 2 : 3,
      handle_admin_id: adminId,
      handle_result: result,
      handle_time: new Date()
    }, { transaction: t });

    await db.Notification.create({
      user_type: 1,
      user_id: complaint.user_id,
      type: 'complaint_handled',
      title: '投诉已处理',
      content: `您的投诉已${parseInt(action) === 2 ? '处理完成' : '被驳回'}，处理结果：${result}`,
      order_id: complaint.order_id
    }, { transaction: t });

    if (complaint.worker_id) {
      await db.Notification.create({
        user_type: 2,
        user_id: complaint.worker_id,
        type: 'complaint_result',
        title: '投诉处理结果',
        content: `关于您的投诉已处理，结果：${result}`,
        order_id: complaint.order_id
      }, { transaction: t });
    }

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'complaint',
      action: 'handle',
      target_id: id,
      content: `处理投诉，结果：${parseInt(action) === 2 ? '处理完成' : '驳回'}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '处理成功');
  } catch (err) {
    await t.rollback();
    console.error('处理投诉错误:', err);
    error(res, err.message || '处理失败', 500);
  }
};

const getRefundList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { refund_status: { [Op.gt]: 0 } };
    if (status !== undefined && status !== '') where.refund_status = parseInt(status);

    const { count, rows } = await db.Order.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['updated_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取退款列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const getComplaintList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await db.Complaint.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'phone'] },
        { model: db.Order, as: 'order', attributes: ['order_no', 'service_name'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取投诉列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const applyRefund = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;
    const { reason, amount } = req.body;

    if (!reason) {
      return error(res, '请填写退款原因', 400);
    }

    const order = await db.Order.findOne({
      where: { id, user_id: userId },
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.pay_status !== 1 || order.status >= 5) {
      await t.rollback();
      return error(res, '该订单无法申请退款', 400);
    }

    if (order.refund_status > 0) {
      await t.rollback();
      return error(res, '该订单已有退款申请', 400);
    }

    await order.update({
      refund_status: 1,
      refund_reason: reason,
      refund_amount: amount || order.pay_price
    }, { transaction: t });

    await db.Notification.create({
      user_type: 1,
      user_id: userId,
      type: 'refund_applied',
      title: '退款申请已提交',
      content: '您的退款申请已提交，请等待平台审核',
      order_id: id
    }, { transaction: t });

    await t.commit();

    success(res, null, '退款申请已提交');
  } catch (err) {
    await t.rollback();
    console.error('申请退款错误:', err);
    error(res, err.message || '申请失败', 500);
  }
};

module.exports = {
  getOrderList,
  getAdminOrderDetail,
  dispatchOrder,
  reassignOrder,
  handleRefund,
  handleComplaint,
  getRefundList,
  getComplaintList,
  applyRefund
};
