const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');

const createEvaluation = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const {
      order_id, rating, content, images, tags, is_anonymous = 0
    } = req.body;

    if (!order_id || !rating) {
      return error(res, '缺少必要参数', 400);
    }

    if (rating < 1 || rating > 5) {
      return error(res, '评分必须在1-5之间', 400);
    }

    const order = await db.Order.findOne({
      where: { id: order_id, user_id: userId },
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return error(res, '订单不存在', 404);
    }

    if (order.status !== 4) {
      await t.rollback();
      return error(res, '订单未完成，无法评价', 400);
    }

    if (order.is_evaluated) {
      await t.rollback();
      return error(res, '该订单已评价', 400);
    }

    const evaluation = await db.Evaluation.create({
      order_id,
      user_id: userId,
      worker_id: order.worker_id,
      service_id: order.service_id,
      rating,
      content,
      images,
      tags,
      is_anonymous,
      status: 1
    }, { transaction: t });

    await order.update({ is_evaluated: 1 }, { transaction: t });

    if (order.worker_id) {
      const avgRating = await db.Evaluation.findOne({
        where: { worker_id: order.worker_id, status: 1 },
        attributes: [[db.Sequelize.fn('AVG', db.Sequelize.col('rating')), 'avg_rating']],
        transaction: t
      });

      await db.Worker.update(
        { rating: parseFloat(avgRating.getDataValue('avg_rating')).toFixed(2) },
        { where: { id: order.worker_id }, transaction: t }
      );

      await db.Notification.create({
        user_type: 2,
        user_id: order.worker_id,
        type: 'evaluation_created',
        title: '收到新评价',
        content: `您收到一条${rating}星评价`,
        order_id: order.id
      }, { transaction: t });
    }

    await t.commit();

    success(res, { id: evaluation.id }, '评价成功');
  } catch (err) {
    await t.rollback();
    console.error('创建评价错误:', err);
    error(res, err.message || '评价失败', 500);
  }
};

const getEvaluationList = async (req, res) => {
  try {
    const { worker_id, service_id, page = 1, pageSize = 10, rating } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { status: 1 };
    if (worker_id) where.worker_id = worker_id;
    if (service_id) where.service_id = service_id;
    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum === 5) where.rating = 5;
      else if (ratingNum === 4) where.rating = { [Op.gte]: 4, [Op.lt]: 5 };
      else if (ratingNum === 3) where.rating = { [Op.gte]: 3, [Op.lt]: 4 };
      else where.rating = { [Op.lt]: 3 };
    }

    const { count, rows } = await db.Evaluation.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        },
        {
          model: db.Service,
          as: 'service',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    const list = rows.map(item => {
      const data = item.toJSON();
      if (data.is_anonymous) {
        data.user = {
          id: data.user.id,
          nickname: '匿名用户',
          avatar: 'https://img.icons8.com/color/96/user-male-circle--v1.png'
        };
      }
      return data;
    });

    if (worker_id) {
      const stats = await db.Evaluation.findAll({
        where: { worker_id, status: 1 },
        attributes: [
          'rating',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
        ],
        group: ['rating'],
        raw: true
      });

      const total = await db.Evaluation.count({ where: { worker_id, status: 1 } });
      const avgRating = total > 0 ? stats.reduce((sum, s) => sum + s.rating * s.count, 0) / total : 5;

      paginate(res, {
        list,
        stats: {
          avg_rating: avgRating.toFixed(1),
          total_count: total,
          rating_counts: stats
        }
      }, count, parseInt(page), parseInt(pageSize));
    } else {
      paginate(res, list, count, parseInt(page), parseInt(pageSize));
    }
  } catch (err) {
    console.error('获取评价列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const getMyEvaluations = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await db.Evaluation.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: db.Order,
          as: 'order',
          attributes: ['order_no', 'service_name', 'service_image']
        },
        {
          model: db.Worker,
          as: 'worker',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取我的评价错误:', err);
    error(res, '获取失败', 500);
  }
};

const replyEvaluation = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { id } = req.params;
    const { reply_content } = req.body;

    if (!reply_content) {
      return error(res, '缺少回复内容', 400);
    }

    const evaluation = await db.Evaluation.findOne({
      where: { id, worker_id: workerId }
    });

    if (!evaluation) {
      return error(res, '评价不存在', 404);
    }

    if (evaluation.reply_content) {
      return error(res, '已回复过该评价', 400);
    }

    await evaluation.update({
      reply_content,
      reply_time: new Date()
    });

    success(res, null, '回复成功');
  } catch (err) {
    console.error('回复评价错误:', err);
    error(res, '回复失败', 500);
  }
};

module.exports = {
  createEvaluation,
  getEvaluationList,
  getMyEvaluations,
  replyEvaluation
};
