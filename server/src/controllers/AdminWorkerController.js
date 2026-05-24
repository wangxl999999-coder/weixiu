const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');

const getWorkerList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, audit_status, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { id_card: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (audit_status !== undefined && audit_status !== '') where.audit_status = parseInt(audit_status);
    if (status !== undefined && status !== '') where.status = parseInt(status);

    const { count, rows } = await db.Worker.findAndCountAll({
      where,
      include: [
        { model: db.WorkerWallet, as: 'wallet', attributes: ['balance', 'total_income'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize),
      attributes: ['id', 'name', 'phone', 'avatar', 'id_card', 'gender', 'age',
                   'work_years', 'rating', 'order_count', 'deposit', 'audit_status',
                   'audit_remark', 'status', 'is_accept_order', 'created_at']
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取师傅列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const getWorkerDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await db.Worker.findByPk(id, {
      include: [
        { model: db.WorkerCertificate, as: 'certificates' },
        { model: db.WorkerService, as: 'services', include: [{ model: db.Service, as: 'service', attributes: ['id', 'name'] }] },
        { model: db.WorkerWallet, as: 'wallet' }
      ]
    });

    if (!worker) {
      return error(res, '师傅不存在', 404);
    }

    success(res, worker);
  } catch (err) {
    console.error('获取师傅详情错误:', err);
    error(res, '获取失败', 500);
  }
};

const auditWorker = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const { audit_status, audit_remark } = req.body;

    if (audit_status === undefined) {
      return error(res, '缺少审核状态', 400);
    }

    const worker = await db.Worker.findByPk(id, { transaction: t });
    if (!worker) {
      await t.rollback();
      return error(res, '师傅不存在', 404);
    }

    if (worker.audit_status !== 0) {
      await t.rollback();
      return error(res, '该师傅已审核', 400);
    }

    await worker.update({
      audit_status: parseInt(audit_status),
      audit_remark,
      audit_time: new Date(),
      status: parseInt(audit_status) === 1 ? 1 : 0,
      is_accept_order: parseInt(audit_status) === 1 ? 1 : 0
    }, { transaction: t });

    if (parseInt(audit_status) === 1) {
      const wallet = await db.WorkerWallet.findOne({
        where: { worker_id: id },
        transaction: t
      });
      if (!wallet) {
        await db.WorkerWallet.create({
          worker_id: id,
          balance: 0.00,
          total_income: 0.00
        }, { transaction: t });
      }
    }

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'worker',
      action: 'audit',
      target_id: id,
      content: `审核师傅：${worker.name}，结果：${audit_status === 1 ? '通过' : '拒绝'}`
    }, { transaction: t });

    await db.Notification.create({
      user_type: 2,
      user_id: id,
      type: 'audit_result',
      title: audit_status === 1 ? '审核通过' : '审核被拒绝',
      content: audit_status === 1
        ? '恭喜您，入驻审核已通过，可以开始接单了'
        : `入驻审核被拒绝：${audit_remark}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '审核成功');
  } catch (err) {
    await t.rollback();
    console.error('审核师傅错误:', err);
    error(res, err.message || '审核失败', 500);
  }
};

const updateWorkerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return error(res, '缺少状态参数', 400);
    }

    const worker = await db.Worker.findByPk(id);
    if (!worker) {
      return error(res, '师傅不存在', 404);
    }

    await worker.update({ status: parseInt(status) });

    success(res, null, '状态更新成功');
  } catch (err) {
    console.error('更新师傅状态错误:', err);
    error(res, '更新失败', 500);
  }
};

const getWorkerDepositList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { deposit: { [Op.gt]: 0 } };
    if (status !== undefined && status !== '') {
      where.audit_status = parseInt(status);
    }

    const { count, rows } = await db.Worker.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize),
      attributes: ['id', 'name', 'phone', 'deposit', 'audit_status', 'status', 'created_at']
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取保证金列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const updateDeposit = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const { amount, type, remark } = req.body;

    if (!amount || !type) {
      return error(res, '缺少必要参数', 400);
    }

    const worker = await db.Worker.findByPk(id, { transaction: t });
    if (!worker) {
      await t.rollback();
      return error(res, '师傅不存在', 404);
    }

    const newDeposit = type === 1
      ? parseFloat(worker.deposit) + parseFloat(amount)
      : Math.max(0, parseFloat(worker.deposit) - parseFloat(amount));

    await worker.update({ deposit: newDeposit }, { transaction: t });

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'deposit',
      action: type === 1 ? 'increase' : 'decrease',
      target_id: id,
      content: `${type === 1 ? '增加' : '扣除'}保证金：${amount}元，备注：${remark || ''}`
    }, { transaction: t });

    await t.commit();

    success(res, { deposit: newDeposit }, '操作成功');
  } catch (err) {
    await t.rollback();
    console.error('更新保证金错误:', err);
    error(res, err.message || '操作失败', 500);
  }
};

module.exports = {
  getWorkerList,
  getWorkerDetail,
  auditWorker,
  updateWorkerStatus,
  getWorkerDepositList,
  updateDeposit
};
