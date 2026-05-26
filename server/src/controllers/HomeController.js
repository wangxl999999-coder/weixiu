const { Op } = require('sequelize');
const moment = require('moment');
const db = require('../models');
const { success, error, paginate } = require('../utils/response');
const { calculateDistance } = require('../utils');
const config = require('../config');

const getHomeData = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    const categories = await db.ServiceCategory.findAll({
      where: { parent_id: 0, status: 1 },
      order: [['sort', 'ASC']],
      attributes: ['id', 'name', 'icon']
    });

    const now = new Date();
    const flashSales = await db.FlashSale.findAll({
      where: {
        status: 1,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now }
      },
      order: [['sort', 'ASC'], ['id', 'DESC']],
      limit: 6,
      attributes: ['id', 'name', 'service_id', 'service_name', 'service_image',
                   'original_price', 'flash_price', 'total_count', 'sold_count',
                   'start_time', 'end_time']
    });

    const hotServices = await db.Service.findAll({
      where: { status: 1 },
      order: [['sales_count', 'DESC']],
      limit: 10,
      attributes: ['id', 'name', 'category_id', 'icon', 'base_price', 'unit', 'sales_count', 'description']
    });

    const coupons = await db.Coupon.findAll({
      where: {
        status: 1,
        is_new_user: 0,
        [Op.or]: [
          { total_count: 0 },
          { received_count: { [Op.lt]: db.Sequelize.col('total_count') } }
        ]
      },
      order: [['id', 'DESC']],
      limit: 4,
      attributes: ['id', 'name', 'type', 'value', 'min_amount', 'valid_type',
                   'valid_start_date', 'valid_end_date', 'valid_days', 'description']
    });

    let nearbyWorkers = [];
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const radius = config.platform.serviceRadius;

      nearbyWorkers = await db.Worker.findAll({
        where: {
          status: 1,
          audit_status: 1,
          is_accept_order: 1,
          latitude: { [Op.between]: [lat - 0.1, lat + 0.1] },
          longitude: { [Op.between]: [lon - 0.1, lon + 0.1] }
        },
        attributes: ['id', 'name', 'avatar', 'rating', 'order_count', 'latitude', 'longitude', 'work_years'],
        limit: 8
      });

      nearbyWorkers = nearbyWorkers.map(worker => {
        const distance = calculateDistance(lat, lon, worker.latitude, worker.longitude, 'km');
        return {
          ...worker.toJSON(),
          distance: distance <= radius ? distance.toFixed(1) : null
        };
      }).filter(w => w.distance !== null)
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }

    success(res, {
      banners: [
        { id: 1, image: 'https://img.alicdn.com/imgextra/i1/O1CN01aA1aaB1aA1aA1aA1a_!!6000000003337-2-tps-750-320.png', link: '/pages/category/index' },
        { id: 2, image: 'https://img.alicdn.com/imgextra/i2/O1CN01bB2bbB2bB2bB2bB2b_!!6000000007337-2-tps-750-320.png', link: '/pages/coupons/index' },
        { id: 3, image: 'https://img.alicdn.com/imgextra/i3/O1CN01cC3ccC3cC3cC3cC3c_!!6000000000037-2-tps-750-320.png', link: '/pages/flash-sale/index' }
      ],
      categories,
      flashSales,
      hotServices,
      coupons,
      nearbyWorkers
    });
  } catch (err) {
    console.error('获取首页数据错误:', err);
    error(res, '获取数据失败', 500);
  }
};

const getCategories = async (req, res) => {
  try {
    const { parent_id = 0 } = req.query;

    const categories = await db.ServiceCategory.findAll({
      where: { parent_id, status: 1 },
      order: [['sort', 'ASC']],
      include: parent_id == 0 ? [{
        model: db.ServiceCategory,
        as: 'children',
        where: { status: 1 },
        required: false
      }] : [],
      attributes: ['id', 'name', 'parent_id', 'icon']
    });

    success(res, categories);
  } catch (err) {
    console.error('获取分类错误:', err);
    error(res, '获取失败', 500);
  }
};

const getServices = async (req, res) => {
  try {
    const { category_id, keyword, page = 1, pageSize = 10, sort = 'sales' } = req.query;
    const offset = (page - 1) * pageSize;

    const where = { status: 1 };
    if (category_id) where.category_id = category_id;
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };

    let order = [];
    switch (sort) {
      case 'price_asc':
        order = [['base_price', 'ASC']];
        break;
      case 'price_desc':
        order = [['base_price', 'DESC']];
        break;
      case 'sales':
      default:
        order = [['sales_count', 'DESC']];
    }

    const { count, rows } = await db.Service.findAndCountAll({
      where,
      include: [{
        model: db.ServiceCategory,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order,
      offset,
      limit: parseInt(pageSize),
      attributes: ['id', 'name', 'category_id', 'icon', 'banner', 'base_price',
                   'unit', 'service_time', 'sales_count', 'description']
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取服务列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const getServiceDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await db.Service.findByPk(id, {
      include: [{
        model: db.ServiceCategory,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    if (!service || service.status !== 1) {
      return error(res, '服务不存在或已下架', 404);
    }

    await service.increment('sales_count');

    success(res, service);
  } catch (err) {
    console.error('获取服务详情错误:', err);
    error(res, '获取失败', 500);
  }
};

const searchServices = async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;

    if (!keyword) {
      return success(res, { list: [], pagination: { page: 1, pageSize, total: 0, totalPages: 0 } });
    }

    const offset = (page - 1) * pageSize;

    const { count, rows } = await db.Service.findAndCountAll({
      where: {
        status: 1,
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ]
      },
      order: [['sales_count', 'DESC']],
      offset,
      limit: parseInt(pageSize),
      attributes: ['id', 'name', 'icon', 'base_price', 'unit', 'sales_count', 'description']
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('搜索服务错误:', err);
    error(res, '搜索失败', 500);
  }
};

const getHotKeywords = async (req, res) => {
  try {
    success(res, {
      hotKeywords: ['空调维修', '油烟机清洗', '管道疏通', '空调清洗', '日常保洁', '冰箱维修', '水电维修', '开锁'],
      historyKeywords: ['空调清洗', '保洁']
    });
  } catch (err) {
    error(res, '获取失败', 500);
  }
};

const getFlashSales = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    const now = new Date();

    const { count, rows } = await db.FlashSale.findAndCountAll({
      where: {
        status: 1,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now }
      },
      order: [['sort', 'ASC'], ['id', 'DESC']],
      offset,
      limit: parseInt(pageSize)
    });

    paginate(res, rows, count, parseInt(page), parseInt(pageSize));
  } catch (err) {
    console.error('获取秒杀活动错误:', err);
    error(res, '获取失败', 500);
  }
};

const getNearbyWorkers = async (req, res) => {
  try {
    const { latitude, longitude, page = 1, pageSize = 10, service_id } = req.query;

    if (!latitude || !longitude) {
      return error(res, '缺少定位参数', 400);
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = config.platform.serviceRadius;
    const offset = (page - 1) * pageSize;

    const where = {
      status: 1,
      audit_status: 1,
      is_accept_order: 1,
      latitude: { [Op.between]: [lat - 0.15, lat + 0.15] },
      longitude: { [Op.between]: [lon - 0.15, lon + 0.15] }
    };

    const include = [];
    if (service_id) {
      include.push({
        model: db.WorkerService,
        as: 'services',
        where: { service_id, is_enabled: 1 },
        attributes: ['custom_price']
      });
    }

    const { count, rows } = await db.Worker.findAndCountAll({
      where,
      include,
      attributes: ['id', 'name', 'avatar', 'rating', 'order_count',
                   'latitude', 'longitude', 'work_years', 'service_area'],
      offset,
      limit: parseInt(pageSize)
    });

    const workersWithDistance = rows.map(worker => {
      const distance = calculateDistance(lat, lon, worker.latitude, worker.longitude, 'km');
      return {
        ...worker.toJSON(),
        distance: distance.toFixed(1)
      };
    }).filter(w => parseFloat(w.distance) <= radius)
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    success(res, {
      list: workersWithDistance,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (err) {
    console.error('获取附近师傅错误:', err);
    error(res, '获取失败', 500);
  }
};

const getCouponBanners = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await db.Coupon.findAll({
      where: {
        status: 1,
        [Op.or]: [
          { total_count: 0 },
          { received_count: { [Op.lt]: db.Sequelize.col('total_count') } }
        ],
        [Op.or]: [
          { valid_type: 1, valid_start_date: { [Op.lte]: now }, valid_end_date: { [Op.gte]: now } },
          { valid_type: 2 }
        ]
      },
      order: [['id', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'type', 'value', 'min_amount', 'description']
    });

    success(res, coupons);
  } catch (err) {
    console.error('获取优惠券横幅错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  getHomeData,
  getCategories,
  getServices,
  getServiceDetail,
  searchServices,
  getHotKeywords,
  getFlashSales,
  getNearbyWorkers,
  getCouponBanners
};
