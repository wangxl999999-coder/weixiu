const db = require('../models');
const { success, error, paginate } = require('../utils/response');

const createComplaint = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { order_id, type, content, images } = req.body;

    if (!order_id || !type || !content) {
      return error(res, '缺少必要参数', 400);
    }

    const order = await db.Order.findOne({
      where: { id: order_id, user_id: userId }
    });

    if (!order) {
      return error(res, '订单不存在', 404);
    }

    if (order.is_complained) {
      return error(res, '该订单已投诉过', 400);
    }

    const complaint = await db.Complaint.create({
      order_id,
      user_id: userId,
      worker_id: order.worker_id,
      type,
      content,
      images,
      status: 0
    });

    await order.update({ is_complained: 1 });

    success(res, { id: complaint.id }, '投诉提交成功');
  } catch (err) {
    console.error('创建投诉错误:', err);
    error(res, '提交失败', 500);
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await db.Complaint.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: db.Order,
          as: 'order',
          attributes: ['order_no', 'service_name', 'service_image']
        }
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

const getComplaintDetail = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;

    const complaint = await db.Complaint.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: db.Order,
          as: 'order',
          attributes: ['order_no', 'service_name', 'service_image', 'total_price', 'created_at']
        }
      ]
    });

    if (!complaint) {
      return error(res, '投诉不存在', 404);
    }

    success(res, complaint);
  } catch (err) {
    console.error('获取投诉详情错误:', err);
    error(res, '获取失败', 500);
  }
};

const getComplaintTypes = async (req, res) => {
  try {
    success(res, [
      { id: 'service_quality', name: '服务质量问题' },
      { id: 'overcharge', name: '乱收费' },
      { id: 'late', name: '师傅迟到' },
      { id: 'damage', name: '物品损坏' },
      { id: 'attitude', name: '服务态度' },
      { id: 'other', name: '其他问题' }
    ]);
  } catch (err) {
    error(res, '获取失败', 500);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintDetail,
  getComplaintTypes
};
