const db = require('../models');
const { success, error } = require('../utils/response');

const getAddressList = async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const addresses = await db.UserAddress.findAll({
      where: { user_id: userId },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });

    success(res, addresses);
  } catch (err) {
    console.error('获取地址列表错误:', err);
    error(res, '获取失败', 500);
  }
};

const getAddressDetail = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;

    const address = await db.UserAddress.findOne({
      where: { id, user_id: userId }
    });

    if (!address) {
      return error(res, '地址不存在', 404);
    }

    success(res, address);
  } catch (err) {
    console.error('获取地址详情错误:', err);
    error(res, '获取失败', 500);
  }
};

const createAddress = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const {
      name, phone, province, city, district, address,
      house_number, latitude, longitude, is_default = 0, tag
    } = req.body;

    if (!name || !phone || !province || !city || !district || !address) {
      return error(res, '缺少必要参数', 400);
    }

    if (is_default === 1) {
      await db.UserAddress.update(
        { is_default: 0 },
        { where: { user_id: userId }, transaction: t }
      );
    }

    const newAddress = await db.UserAddress.create({
      user_id: userId,
      name,
      phone,
      province,
      city,
      district,
      address,
      house_number,
      latitude,
      longitude,
      is_default,
      tag
    }, { transaction: t });

    await t.commit();

    success(res, { id: newAddress.id }, '添加成功');
  } catch (err) {
    await t.rollback();
    console.error('创建地址错误:', err);
    error(res, '创建失败', 500);
  }
};

const updateAddress = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;
    const {
      name, phone, province, city, district, address,
      house_number, latitude, longitude, is_default, tag
    } = req.body;

    const existAddress = await db.UserAddress.findOne({
      where: { id, user_id: userId },
      transaction: t
    });

    if (!existAddress) {
      await t.rollback();
      return error(res, '地址不存在', 404);
    }

    if (is_default === 1) {
      await db.UserAddress.update(
        { is_default: 0 },
        { where: { user_id: userId, id: { [db.Sequelize.Op.ne]: id } }, transaction: t }
      );
    }

    await existAddress.update({
      name, phone, province, city, district, address,
      house_number, latitude, longitude, is_default, tag
    }, { transaction: t });

    await t.commit();

    success(res, null, '更新成功');
  } catch (err) {
    await t.rollback();
    console.error('更新地址错误:', err);
    error(res, '更新失败', 500);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;

    const address = await db.UserAddress.findOne({
      where: { id, user_id: userId }
    });

    if (!address) {
      return error(res, '地址不存在', 404);
    }

    await address.destroy();

    success(res, null, '删除成功');
  } catch (err) {
    console.error('删除地址错误:', err);
    error(res, '删除失败', 500);
  }
};

const setDefaultAddress = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.currentUser.id;
    const { id } = req.params;

    const address = await db.UserAddress.findOne({
      where: { id, user_id: userId },
      transaction: t
    });

    if (!address) {
      await t.rollback();
      return error(res, '地址不存在', 404);
    }

    await db.UserAddress.update(
      { is_default: 0 },
      { where: { user_id: userId }, transaction: t }
    );

    await address.update({ is_default: 1 }, { transaction: t });

    await t.commit();

    success(res, null, '设置成功');
  } catch (err) {
    await t.rollback();
    console.error('设置默认地址错误:', err);
    error(res, '设置失败', 500);
  }
};

const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const address = await db.UserAddress.findOne({
      where: { user_id: userId, is_default: 1 }
    });

    if (!address) {
      const firstAddress = await db.UserAddress.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      });
      return success(res, firstAddress || null);
    }

    success(res, address);
  } catch (err) {
    console.error('获取默认地址错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  getAddressList,
  getAddressDetail,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress
};
