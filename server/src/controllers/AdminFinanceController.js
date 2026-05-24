const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');
const paymentService = require('../services/paymentService');

const getWithdrawList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword, start_date, end_date } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (keyword) {
      where[Op.or] = [
        { withdraw_no: { [Op.like]: `%${keyword}%` } },
        { worker_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, `${end_date} 23:59:59`] };
    }

    const { count, rows } = await db.Withdrawal.findAndCountAll({
      where,
      include: [
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'phone', 'avatar'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取提现列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const auditWithdraw = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { id } = req.params;
    const { action, remark } = req.body;

    if (action === undefined) {
      return error(res, '请选择审核结果', 400);
    }

    const withdrawal = await db.Withdrawal.findByPk(id, {
      include: [{ model: db.Worker, as: 'worker' }],
      transaction: t
    });

    if (!withdrawal) {
      await t.rollback();
      return error(res, '提现记录不存在', 404);
    }

    if (withdrawal.status !== 0) {
      await t.rollback();
      return error(res, '该提现已审核', 400);
    }

    if (parseInt(action) === 1) {
      await withdrawal.update({
        status: 1,
        audit_admin_id: adminId,
        audit_remark: remark,
        audit_time: new Date()
      }, { transaction: t });

      try {
        const transferResult = await paymentService.transfer(
          withdrawal.worker,
          withdrawal.actual_amount,
          withdrawal.withdraw_no
        );

        await withdrawal.update({
          status: 4,
          transfer_no: transferResult.paymentNo,
          transfer_time: new Date()
        }, { transaction: t });

        const wallet = await db.WorkerWallet.findOne({
          where: { worker_id: withdrawal.worker_id },
          transaction: t
        });
        await wallet.update({
          frozen_amount: db.Sequelize.literal(`frozen_amount - ${withdrawal.amount}`),
          total_withdraw: db.Sequelize.literal(`total_withdraw + ${withdrawal.amount}`)
        }, { transaction: t });

        await db.FinancialRecord.create({
          record_no: require('../utils').generateRecordNo(),
          worker_id: withdrawal.worker_id,
          withdraw_id: id,
          type: 3,
          amount: -withdrawal.amount,
          balance_after: parseFloat(wallet.balance),
          description: `提现成功，金额：${withdrawal.amount}元`
        }, { transaction: t });

        await db.Notification.create({
          user_type: 2,
          user_id: withdrawal.worker_id,
          type: 'withdraw_success',
          title: '提现成功',
          content: `您的提现${withdrawal.withdraw_no}已成功到账`,
        }, { transaction: t });

      } catch (transferErr) {
        await withdrawal.update({
          status: 5,
          fail_reason: transferErr.message
        }, { transaction: t });

        const wallet = await db.WorkerWallet.findOne({
          where: { worker_id: withdrawal.worker_id },
          transaction: t
        });
        await wallet.update({
          balance: db.Sequelize.literal(`balance + ${withdrawal.amount}`),
          frozen_amount: db.Sequelize.literal(`frozen_amount - ${withdrawal.amount}`)
        }, { transaction: t });

        await db.FinancialRecord.create({
          record_no: require('../utils').generateRecordNo(),
          worker_id: withdrawal.worker_id,
          withdraw_id: id,
          type: 4,
          amount: withdrawal.amount,
          balance_after: parseFloat(wallet.balance) + parseFloat(withdrawal.amount),
          description: `提现失败退回，金额：${withdrawal.amount}元`
        }, { transaction: t });

        await db.Notification.create({
          user_type: 2,
          user_id: withdrawal.worker_id,
          type: 'withdraw_fail',
          title: '提现失败',
          content: `您的提现${withdrawal.withdraw_no}失败：${transferErr.message}`,
        }, { transaction: t });
      }
    } else {
      await withdrawal.update({
        status: 2,
        audit_admin_id: adminId,
        audit_remark: remark,
        audit_time: new Date()
      }, { transaction: t });

      const wallet = await db.WorkerWallet.findOne({
        where: { worker_id: withdrawal.worker_id },
        transaction: t
      });
      await wallet.update({
        balance: db.Sequelize.literal(`balance + ${withdrawal.amount}`),
        frozen_amount: db.Sequelize.literal(`frozen_amount - ${withdrawal.amount}`)
      }, { transaction: t });

      await db.FinancialRecord.create({
        record_no: require('../utils').generateRecordNo(),
        worker_id: withdrawal.worker_id,
        withdraw_id: id,
        type: 4,
        amount: withdrawal.amount,
        balance_after: parseFloat(wallet.balance) + parseFloat(withdrawal.amount),
        description: `提现审核被拒退回，金额：${withdrawal.amount}元`
      }, { transaction: t });

      await db.Notification.create({
        user_type: 2,
        user_id: withdrawal.worker_id,
        type: 'withdraw_rejected',
        title: '提现被拒绝',
        content: `您的提现${withdrawal.withdraw_no}被拒绝：${remark}`,
      }, { transaction: t });
    }

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'finance',
      action: 'audit_withdraw',
      target_id: id,
      content: `审核提现${withdrawal.withdraw_no}，结果：${parseInt(action) === 1 ? '通过' : '拒绝'}`
    }, { transaction: t });

    await t.commit();

    success(res, null, '审核完成');
  } catch (err) {
    await t.rollback();
    console.error('审核提现错误:', err);
    error(res, err.message || '审核失败', 500);
  }
};

const getPlatformFeeConfig = async (req, res) => {
  try {
    const configs = await db.SystemConfig.findAll({
      where: { config_group: 'finance' }
    });

    success(res, configs.reduce((acc, c) => {
      acc[c.config_key] = c.config_value;
      return acc;
    }, {}));
  } catch (err) {
    console.error('获取抽佣配置错误:', err);
    error(res, '获取失败', 500);
  }
};

const updatePlatformFeeConfig = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const adminId = req.currentAdmin.id;
    const { platform_fee_rate, min_withdraw_amount, withdraw_fee_rate } = req.body;

    const configs = [
      { key: 'platform_fee_rate', value: platform_fee_rate },
      { key: 'min_withdraw_amount', value: min_withdraw_amount },
      { key: 'withdraw_fee_rate', value: withdraw_fee_rate }
    ];

    for (const cfg of configs) {
      if (cfg.value !== undefined) {
        await db.SystemConfig.update(
          { config_value: cfg.value },
          { where: { config_key: cfg.key }, transaction: t }
        );
      }
    }

    await db.OperationLog.create({
      admin_id: adminId,
      admin_name: req.currentAdmin.name,
      module: 'config',
      action: 'update_finance',
      content: '更新财务配置'
    }, { transaction: t });

    await t.commit();

    success(res, null, '配置更新成功');
  } catch (err) {
    await t.rollback();
    console.error('更新抽佣配置错误:', err);
    error(res, err.message || '更新失败', 500);
  }
};

const getFinancialOverview = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = {};
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, `${end_date} 23:59:59`] };
    }

    const totalOrders = await db.Order.count({ where: { ...where, status: 4 } });
    const totalIncome = await db.Order.sum('pay_price', { where: { ...where, status: 4 } }) || 0;
    const totalPlatformFee = await db.Order.sum('platform_fee', { where: { ...where, status: 4 } }) || 0;
    const totalWorkerIncome = await db.Order.sum('worker_price', { where: { ...where, status: 4 } }) || 0;
    const totalWithdraw = await db.Withdrawal.sum('amount', { where: { ...where, status: 4 } }) || 0;
    const totalUsers = await db.User.count({ where: { status: 1 } });
    const totalWorkers = await db.Worker.count({ where: { audit_status: 1 } });
    const pendingOrders = await db.Order.count({ where: { status: { [Op.in]: [0, 1, 2, 3] } } });
    const pendingWithdraws = await db.Withdrawal.count({ where: { status: 0 } });
    const pendingComplaints = await db.Complaint.count({ where: { status: 0 } });

    success(res, {
      total_orders: totalOrders,
      total_income: totalIncome.toFixed(2),
      total_platform_fee: totalPlatformFee.toFixed(2),
      total_worker_income: totalWorkerIncome.toFixed(2),
      total_withdraw: totalWithdraw.toFixed(2),
      total_users: totalUsers,
      total_workers: totalWorkers,
      pending_orders: pendingOrders,
      pending_withdraws: pendingWithdraws,
      pending_complaints: pendingComplaints
    });
  } catch (err) {
    console.error('获取财务概览错误:', err);
    error(res, '获取失败', 500);
  }
};

const getFinanceRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, start_date, end_date } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (type) where.type = parseInt(type);
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, `${end_date} 23:59:59`] };
    }

    const { count, rows } = await db.FinancialRecord.findAndCountAll({
      where,
      include: [
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'phone'] },
        { model: db.Order, as: 'order', attributes: ['order_no', 'service_name'] },
        { model: db.Withdrawal, as: 'withdrawal', attributes: ['withdraw_no'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取财务流水错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  getWithdrawList,
  auditWithdraw,
  getPlatformFeeConfig,
  updatePlatformFeeConfig,
  getFinancialOverview,
  getFinanceRecords
};
