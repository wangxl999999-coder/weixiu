const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');
const { generateWithdrawNo, generateRecordNo } = require('../utils');
const paymentService = require('../services/paymentService');
const config = require('../config');

const getWalletInfo = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;

    const wallet = await db.WorkerWallet.findOne({
      where: { worker_id: workerId }
    });

    if (!wallet) {
      return error(res, '钱包不存在', 404);
    }

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayIncome = await db.FinancialRecord.sum('amount', {
      where: {
        worker_id: workerId,
        type: 1,
        created_at: {
          [Op.gte]: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        }
      }
    }) || 0;

    const monthIncome = await db.FinancialRecord.sum('amount', {
      where: {
        worker_id: workerId,
        type: 1,
        created_at: { [Op.gte]: monthStart }
      }
    }) || 0;

    await wallet.update({
      today_income: todayIncome,
      month_income: monthIncome
    });

    success(res, {
      balance: wallet.balance,
      frozen_amount: wallet.frozen_amount,
      total_income: wallet.total_income,
      total_withdraw: wallet.total_withdraw,
      today_income: todayIncome,
      month_income: monthIncome,
      min_withdraw: config.platform.minWithdraw
    });
  } catch (err) {
    console.error('获取钱包信息错误:', err);
    error(res, '获取失败', 500);
  }
};

const getFinancialRecords = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { type, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { worker_id: workerId };
    if (type) where.type = parseInt(type);

    const { count, rows } = await db.FinancialRecord.findAndCountAll({
      where,
      include: [
        { model: db.Order, as: 'order', attributes: ['order_no', 'service_name'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取财务记录错误:', err);
    error(res, '获取失败', 500);
  }
};

const applyWithdraw = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const workerId = req.currentWorker.id;
    const worker = req.currentWorker;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return error(res, '请输入提现金额', 400);
    }

    if (amount < config.platform.minWithdraw) {
      return error(res, `最低提现金额为${config.platform.minWithdraw}元`, 400);
    }

    const wallet = await db.WorkerWallet.findOne({
      where: { worker_id: workerId },
      transaction: t
    });

    if (!wallet) {
      await t.rollback();
      return error(res, '钱包不存在', 404);
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      await t.rollback();
      return error(res, '余额不足', 400);
    }

    const pendingWithdraw = await db.Withdrawal.count({
      where: { worker_id: workerId, status: { [Op.in]: [0, 1, 3] } },
      transaction: t
    });

    if (pendingWithdraw > 0) {
      await t.rollback();
      return error(res, '您有一笔提现正在处理中，请等待处理完成', 400);
    }

    const fee = amount * (config.platform.withdrawFeeRate / 100);
    const actualAmount = amount - fee;

    const withdrawNo = generateWithdrawNo();

    const withdrawal = await db.Withdrawal.create({
      withdraw_no: withdrawNo,
      worker_id: workerId,
      worker_name: worker.name,
      amount,
      fee,
      actual_amount: actualAmount,
      withdraw_type: 1,
      status: 0
    }, { transaction: t });

    await wallet.update({
      balance: db.Sequelize.literal(`balance - ${amount}`),
      frozen_amount: db.Sequelize.literal(`frozen_amount + ${amount}`)
    }, { transaction: t });

    await db.FinancialRecord.create({
      record_no: generateRecordNo(),
      worker_id: workerId,
      withdraw_id: withdrawal.id,
      type: 3,
      amount: -amount,
      balance_after: parseFloat(wallet.balance) - parseFloat(amount),
      description: `申请提现，金额：${amount}元`
    }, { transaction: t });

    await t.commit();

    success(res, {
      id: withdrawal.id,
      withdraw_no: withdrawal.withdraw_no,
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      actual_amount: withdrawal.actual_amount,
      status: withdrawal.status
    }, '提现申请已提交，等待审核');
  } catch (err) {
    await t.rollback();
    console.error('申请提现错误:', err);
    error(res, err.message || '申请失败', 500);
  }
};

const getWithdrawList = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { worker_id: workerId };
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }

    const { count, rows } = await db.Withdrawal.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取提现记录错误:', err);
    error(res, '获取失败', 500);
  }
};

const getWithdrawDetail = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { id } = req.params;

    const withdrawal = await db.Withdrawal.findOne({
      where: { id, worker_id: workerId }
    });

    if (!withdrawal) {
      return error(res, '提现记录不存在', 404);
    }

    success(res, withdrawal);
  } catch (err) {
    console.error('获取提现详情错误:', err);
    error(res, '获取失败', 500);
  }
};

const getIncomeStatistics = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { type = 'month' } = req.query;

    const now = new Date();
    let startDate, endDate, dateFormat;

    if (type === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      dateFormat = '%Y-%m-%d';
    } else if (type === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      dateFormat = '%Y-%m';
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      dateFormat = '%Y-%m-%d';
    }

    const records = await db.FinancialRecord.findAll({
      where: {
        worker_id: workerId,
        type: { [Op.in]: [1, 2] },
        created_at: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('created_at'), dateFormat), 'date'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'total']
      ],
      group: ['date'],
      raw: true
    });

    const totalIncome = records.reduce((sum, r) => sum + parseFloat(r.total || 0), 0);
    const orderCount = await db.Order.count({
      where: {
        worker_id: workerId,
        status: 4,
        created_at: { [Op.between]: [startDate, endDate] }
      }
    });

    success(res, {
      total_income: totalIncome.toFixed(2),
      order_count: orderCount,
      records
    });
  } catch (err) {
    console.error('获取收入统计错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  getWalletInfo,
  getFinancialRecords,
  applyWithdraw,
  getWithdrawList,
  getWithdrawDetail,
  getIncomeStatistics
};
