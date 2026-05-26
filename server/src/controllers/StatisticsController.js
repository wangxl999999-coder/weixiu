const { Op } = require('sequelize');
const db = require('../models');
const { success, error } = require('../utils/response');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    const results = await Promise.all([
      db.Order.count({ where: { created_at: { [Op.gte]: todayStart } } }),
      db.Order.count({ where: { created_at: { [Op.between]: [yesterdayStart, todayStart] } } }),
      db.Order.sum('pay_price', { where: { created_at: { [Op.gte]: todayStart }, status: 4 } }),
      db.Order.sum('pay_price', { where: { created_at: { [Op.between]: [yesterdayStart, todayStart] }, status: 4 } }),
      db.Order.count({ where: { created_at: { [Op.gte]: weekStart } } }),
      db.Order.count({ where: { created_at: { [Op.gte]: monthStart } } }),
      db.Order.sum('pay_price', { where: { created_at: { [Op.gte]: weekStart }, status: 4 } }),
      db.Order.sum('pay_price', { where: { created_at: { [Op.gte]: monthStart }, status: 4 } }),
      db.User.count(),
      db.Worker.count({ where: { audit_status: 1 } }),
      db.Order.count({ where: { status: { [Op.in]: [0, 1, 2, 3] } } }),
      db.Withdrawal.count({ where: { status: 0 } }),
      db.Complaint.count({ where: { status: 0 } })
    ]);

    const [
      todayOrders, yesterdayOrders, todayIncomeRaw, yesterdayIncomeRaw,
      weekOrders, monthOrders, weekIncomeRaw, monthIncomeRaw,
      totalUsers, totalWorkers, pendingOrders,
      pendingWithdraws, pendingComplaints
    ] = results;

    const todayIncome = todayIncomeRaw || 0;
    const yesterdayIncome = yesterdayIncomeRaw || 0;
    const weekIncome = weekIncomeRaw || 0;
    const monthIncome = monthIncomeRaw || 0;

    const orderGrowth = yesterdayOrders === 0 ? 100 : Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100);
    const incomeGrowth = yesterdayIncome === 0 ? 100 : Math.round(((todayIncome - yesterdayIncome) / yesterdayIncome) * 100);

    success(res, {
      today: {
      order_count: todayOrders,
      order_growth: orderGrowth,
      income: parseFloat(todayIncome).toFixed(2),
      income_growth: incomeGrowth
    },
      week: {
      order_count: weekOrders,
      income: parseFloat(weekIncome).toFixed(2)
    },
      month: {
      order_count: monthOrders,
      income: parseFloat(monthIncome).toFixed(2)
    },
      total_users: totalUsers,
      total_workers: totalWorkers,
      pending_orders: pendingOrders,
      pending_withdraws: pendingWithdraws,
      pending_complaints: pendingComplaints
    });
  } catch (err) {
    console.error('获取首页统计错误:', err);
    error(res, '获取失败', 500);
  }
};

const getOrderTrend = async (req, res) => {
  try {
    const { type = 'week' } = req.query;
    const now = new Date();
    let startDate, dateFormat, groupFormat;

    if (type === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      groupFormat = '%Y-%m-%d';
    } else if (type === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupFormat = '%Y-%m-%d';
    } else if (type === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupFormat = '%Y-%m';
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      groupFormat = '%Y-%m-%d';
    }

    const orders = await db.Order.findAll({
      where: { created_at: { [Op.gte]: startDate }, status: 4 },
      attributes: [
        [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('created_at'), groupFormat), 'date'],
        [db.Sequelize.fn('COUNT', '*'), 'count'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('pay_price')), 'amount']
      ],
      group: ['date'],
      order: ['date'],
      raw: true
    });

    const result = {};
    orders.forEach(o => {
      result[o.date] = {
        count: parseInt(o.count),
        amount: parseFloat(o.amount || 0)
      };
    });

    const labels = [];
    const counts = [];
    const amounts = [];

    if (type === 'week' || type === 'days') {
      for (let i = (type === 'week' ? 6 : 29); i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        labels.push(dateStr);
        counts.push(result[dateStr]?.count || 0);
        amounts.push(result[dateStr]?.amount || 0);
      }
    } else if (type === 'year') {
      for (let i = 0; i < 12; i++) {
        const dateStr = `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        labels.push(dateStr);
        counts.push(result[dateStr]?.count || 0);
        amounts.push(result[dateStr]?.amount || 0);
      }
    }

    success(res, {
      labels,
      order_counts: counts,
      order_amounts: amounts.map(a => parseFloat(a.toFixed(2)))
    });
  } catch (err) {
    console.error('获取订单趋势错误:', err);
    error(res, '获取失败', 500);
  }
};

const getServiceStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = { status: 4 };
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, `${end_date} 23:59:59`] };
    }

    const stats = await db.Order.findAll({
      where,
      include: [
        { model: db.Service, as: 'service', attributes: ['id', 'name'], include: [{ model: db.Category, as: 'category', attributes: ['name'] }] }
      ],
      attributes: [
        'service_id',
        [db.Sequelize.fn('COUNT', '*'), 'count'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('pay_price')), 'amount']
      ],
      group: ['service_id'],
      order: [[db.Sequelize.literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });

    const result = stats.map(s => ({
      service_id: s.service_id,
      service_name: s.service?.name || '未知服务',
      category_name: s.service?.category?.name || '未知分类',
      count: parseInt(s.count),
      amount: parseFloat(s.amount || 0).toFixed(2)
    }));

    success(res, result);
  } catch (err) {
    console.error('获取服务统计错误:', err);
    error(res, '获取失败', 500);
  }
};

const getWorkerRanking = async (req, res) => {
  try {
    const { start_date, end_date, limit = 10 } = req.query;

    const where = { status: 4, worker_id: { [Op.ne]: null } };
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, `${end_date} 23:59:59`] };
    }

    const stats = await db.Order.findAll({
      where,
      include: [
        { model: db.Worker, as: 'worker', attributes: ['id', 'name', 'avatar', 'phone'] }
      ],
      attributes: [
        'worker_id',
        [db.Sequelize.fn('COUNT', '*'), 'order_count'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('worker_price')), 'income']
      ],
      group: ['worker_id'],
      order: [[db.Sequelize.literal('income'), 'DESC']],
      limit: parseInt(limit),
      raw: true
    });

    const result = stats.map((s, index) => ({
      rank: index + 1,
      worker_id: s.worker_id,
      worker_name: s.worker?.name || '未知',
      worker_avatar: s.worker?.avatar,
      worker_phone: s.worker?.phone,
      order_count: parseInt(s.order_count),
      income: parseFloat(s.income || 0).toFixed(2)
    }));

    success(res, result);
  } catch (err) {
    console.error('获取师傅排行错误:', err);
    error(res, '获取失败', 500);
  }
};

const getRegionStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = { status: 4 };
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, `${end_date} 23:59:59`] };
    }

    const stats = await db.Order.findAll({
      where,
      attributes: [
        [db.Sequelize.literal("JSON_EXTRACT(address_info, '$.city')"), 'city'],
        [db.Sequelize.fn('COUNT', '*'), 'count'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('pay_price')), 'amount']
      ],
      group: ['city'],
      order: [[db.Sequelize.literal('count'), 'DESC']],
      limit: 20,
      raw: true
    });

    success(res, stats.map(s => ({
      city: s.city || '未知城市',
      count: parseInt(s.count),
      amount: parseFloat(s.amount || 0).toFixed(2)
    })));
  } catch (err) {
    console.error('获取地区统计错误:', err);
    error(res, '获取失败', 500);
  }
};

const getUserGrowth = async (req, res) => {
  try {
    const { type = 'month' } = req.query;
    const now = new Date();
    let startDate, groupFormat, periodCount;

    if (type === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      groupFormat = '%Y-%m-%d';
      periodCount = 7;
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      groupFormat = '%Y-%m';
      periodCount = 6;
    }

    const userStats = await db.User.findAll({
      where: { created_at: { [Op.gte]: startDate } },
      attributes: [
        [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('created_at'), groupFormat), 'date'],
        [db.Sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['date'],
      raw: true
    });

    const workerStats = await db.Worker.findAll({
      where: { created_at: { [Op.gte]: startDate } },
      attributes: [
        [db.Sequelize.fn('DATE_FORMAT', db.Sequelize.col('created_at'), groupFormat), 'date'],
        [db.Sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['date'],
      raw: true
    });

    const userMap = {}, workerMap = {};
    userStats.forEach(s => userMap[s.date] = parseInt(s.count));
    workerStats.forEach(s => workerMap[s.date] = parseInt(s.count));

    const labels = [];
    const userCounts = [];
    const workerCounts = [];

    if (type === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        labels.push(dateStr);
        userCounts.push(userMap[dateStr] || 0);
        workerCounts.push(workerMap[dateStr] || 0);
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        labels.push(dateStr);
        userCounts.push(userMap[dateStr] || 0);
        workerCounts.push(workerMap[dateStr] || 0);
      }
    }

    success(res, {
      labels,
      user_counts: userCounts,
      worker_counts: workerCounts
    });
  } catch (err) {
    console.error('获取用户增长错误:', err);
    error(res, '获取失败', 500);
  }
};

const getFinancialStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = { status: 4 };
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, `${end_date} 23:59:59`] };
    }

    const orderStats = await db.Order.findOne({
      where,
      attributes: [
        [db.Sequelize.fn('COUNT', '*'), 'order_count'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('pay_price')), 'total_income'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('platform_fee')), 'platform_fee'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('worker_price')), 'worker_income']
      ],
      raw: true
    });

    const totalWithdraw = await db.Withdrawal.sum('amount', { where: { status: 4 } }) || 0;
    const pendingWithdraw = await db.Withdrawal.sum('amount', { where: { status: 0 } }) || 0;

    success(res, {
      order_count: parseInt(orderStats?.order_count || 0),
      total_income: parseFloat(orderStats?.total_income || 0).toFixed(2),
      platform_fee: parseFloat(orderStats?.platform_fee || 0).toFixed(2),
      worker_income: parseFloat(orderStats?.worker_income || 0).toFixed(2),
      total_withdraw: parseFloat(totalWithdraw).toFixed(2),
      pending_withdraw: parseFloat(pendingWithdraw).toFixed(2)
    });
  } catch (err) {
    console.error('获取财务统计错误:', err);
    error(res, '获取失败', 500);
  }
};

const getOrderStatusStats = async (req, res) => {
  try {
    const statuses = [
      { key: 0, name: '待接单', color: '#faad14' },
      { key: 1, name: '已接单', color: '#1890ff' },
      { key: 2, name: '服务中', color: '#13c2c2' },
      { key: 3, name: '待确认', color: '#722ed1' },
      { key: 4, name: '已完成', color: '#52c41a' },
      { key: 5, name: '已取消', color: '#f5222d' },
      { key: 6, name: '已退款', color: '#8c8c8c' }
    ];

    const result = await Promise.all(statuses.map(async s => {
      const count = await db.Order.count({ where: { status: s.key } });
      return {
        status: s.key,
        name: s.name,
        count,
        color: s.color
      };
    }));

    success(res, result);
  } catch (err) {
    console.error('获取订单状态统计错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  getDashboardStats,
  getOrderTrend,
  getServiceStats,
  getWorkerRanking,
  getRegionStats,
  getUserGrowth,
  getFinancialStats,
  getOrderStatusStats
};
