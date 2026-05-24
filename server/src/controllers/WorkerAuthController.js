const bcrypt = require('bcryptjs');
const db = require('../models');
const { success, error } = require('../utils/response');
const { generateToken } = require('../middleware/auth');
const { getWechatSession, getPhoneNumber } = require('../services/wechatService');
const { isValidPhone, isValidIdCard } = require('../utils');

const loginByPhone = async (req, res) => {
  try {
    const { phone, password, code } = req.body;

    if (!phone || (!password && !code)) {
      return error(res, '缺少必要参数', 400);
    }

    if (!isValidPhone(phone)) {
      return error(res, '手机号格式不正确', 400);
    }

    const worker = await db.Worker.findOne({ where: { phone } });

    if (!worker) {
      return error(res, '账号不存在，请先注册', 404);
    }

    if (worker.status !== 1) {
      return error(res, '账号已被禁用', 403);
    }

    if (password) {
      const isValid = await bcrypt.compare(password, worker.password);
      if (!isValid) {
        return error(res, '密码错误', 400);
      }
    } else if (code) {
      const phoneInfo = await getPhoneNumber(code, 'worker');
      if (phoneInfo.phoneNumber !== phone) {
        return error(res, '手机号验证失败', 400);
      }
    }

    if (worker.audit_status === 0) {
      return error(res, '审核中，请等待平台审核', 403);
    }

    if (worker.audit_status === 2) {
      return error(res, `审核被拒绝：${worker.audit_remark}`, 403);
    }

    const token = generateToken(worker, 'worker');

    success(res, {
      token,
      worker: {
        id: worker.id,
        phone: worker.phone,
        name: worker.name,
        avatar: worker.avatar,
        audit_status: worker.audit_status,
        status: worker.status
      }
    }, '登录成功');
  } catch (err) {
    console.error('师傅登录错误:', err);
    error(res, err.message || '登录失败', 500);
  }
};

const register = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      phone, code, password, name, id_card,
      id_card_front, id_card_back, gender, age,
      certificates, service_ids, latitude, longitude, address
    } = req.body;

    if (!phone || !code || !name || !id_card || !id_card_front || !id_card_back) {
      return error(res, '缺少必要参数', 400);
    }

    if (!isValidPhone(phone)) {
      return error(res, '手机号格式不正确', 400);
    }

    if (!isValidIdCard(id_card)) {
      return error(res, '身份证号格式不正确', 400);
    }

    const existWorker = await db.Worker.findOne({ where: { phone }, transaction: t });
    if (existWorker) {
      await t.rollback();
      return error(res, '该手机号已注册', 400);
    }

    const existIdCard = await db.Worker.findOne({ where: { id_card }, transaction: t });
    if (existIdCard) {
      await t.rollback();
      return error(res, '该身份证已注册', 400);
    }

    const phoneInfo = await getPhoneNumber(code, 'worker');
    if (phoneInfo.phoneNumber !== phone) {
      await t.rollback();
      return error(res, '手机号验证失败', 400);
    }

    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    const worker = await db.Worker.create({
      phone,
      password: hashedPassword,
      name,
      id_card,
      id_card_front,
      id_card_back,
      gender: gender || 0,
      age,
      latitude,
      longitude,
      address,
      audit_status: 0,
      status: 0,
      is_accept_order: 0
    }, { transaction: t });

    if (certificates && certificates.length > 0) {
      await Promise.all(certificates.map(cert =>
        db.WorkerCertificate.create({
          worker_id: worker.id,
          certificate_type: cert.type,
          certificate_name: cert.name,
          certificate_no: cert.no,
          certificate_image: cert.image,
          issued_date: cert.issued_date,
          expiry_date: cert.expiry_date,
          audit_status: 0
        }, { transaction: t })
      ));
    }

    if (service_ids && service_ids.length > 0) {
      await Promise.all(service_ids.map(service_id =>
        db.WorkerService.create({
          worker_id: worker.id,
          service_id,
          is_enabled: 1
        }, { transaction: t })
      ));
    }

    await db.WorkerWallet.create({
      worker_id: worker.id,
      balance: 0.00,
      total_income: 0.00
    }, { transaction: t });

    await t.commit();

    success(res, {
      id: worker.id,
      phone: worker.phone,
      audit_status: 0
    }, '注册成功，请等待审核');
  } catch (err) {
    await t.rollback();
    console.error('师傅注册错误:', err);
    error(res, err.message || '注册失败', 500);
  }
};

const getWorkerInfo = async (req, res) => {
  try {
    const worker = req.currentWorker;

    const wallet = await db.WorkerWallet.findOne({
      where: { worker_id: worker.id },
      attributes: ['balance', 'today_income', 'month_income', 'total_income']
    });

    const orderCount = await db.Order.count({
      where: { worker_id: worker.id, status: { [db.Sequelize.Op.in]: [1, 2] } }
    });

    success(res, {
      id: worker.id,
      phone: worker.phone,
      name: worker.name,
      avatar: worker.avatar,
      id_card: worker.id_card,
      gender: worker.gender,
      age: worker.age,
      work_years: worker.work_years,
      rating: worker.rating,
      order_count: worker.order_count,
      service_area: worker.service_area,
      work_time: worker.work_time,
      latitude: worker.latitude,
      longitude: worker.longitude,
      address: worker.address,
      deposit: worker.deposit,
      audit_status: worker.audit_status,
      audit_remark: worker.audit_remark,
      status: worker.status,
      is_accept_order: worker.is_accept_order,
      wallet,
      pending_order_count: orderCount,
      created_at: worker.created_at
    });
  } catch (err) {
    console.error('获取师傅信息错误:', err);
    error(res, '获取失败', 500);
  }
};

const updateWorkerInfo = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const {
      name, avatar, gender, age, work_years,
      latitude, longitude, address, avatar_file
    } = req.body;

    await db.Worker.update(
      { name, avatar, gender, age, work_years, latitude, longitude, address },
      { where: { id: workerId } }
    );

    success(res, null, '更新成功');
  } catch (err) {
    console.error('更新师傅信息错误:', err);
    error(res, '更新失败', 500);
  }
};

const updateServiceSettings = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const workerId = req.currentWorker.id;
    const { service_area, work_time, service_ids, is_accept_order } = req.body;

    await db.Worker.update(
      { service_area, work_time, is_accept_order },
      { where: { id: workerId }, transaction: t }
    );

    if (service_ids) {
      await db.WorkerService.destroy({
        where: { worker_id: workerId },
        transaction: t
      });

      await Promise.all(service_ids.map(service_id =>
        db.WorkerService.create({
          worker_id: workerId,
          service_id,
          is_enabled: 1
        }, { transaction: t })
      ));
    }

    await t.commit();

    success(res, null, '设置成功');
  } catch (err) {
    await t.rollback();
    console.error('更新服务设置错误:', err);
    error(res, '设置失败', 500);
  }
};

const updateAcceptStatus = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;
    const { is_accept_order } = req.body;

    if (is_accept_order === undefined) {
      return error(res, '缺少必要参数', 400);
    }

    await db.Worker.update(
      { is_accept_order: is_accept_order ? 1 : 0 },
      { where: { id: workerId } }
    );

    success(res, null, '设置成功');
  } catch (err) {
    console.error('更新接单状态错误:', err);
    error(res, '设置失败', 500);
  }
};

const getCertificates = async (req, res) => {
  try {
    const workerId = req.currentWorker.id;

    const certificates = await db.WorkerCertificate.findAll({
      where: { worker_id: workerId },
      order: [['created_at', 'DESC']]
    });

    success(res, certificates);
  } catch (err) {
    console.error('获取证书列表错误:', err);
    error(res, '获取失败', 500);
  }
};

module.exports = {
  loginByPhone,
  register,
  getWorkerInfo,
  updateWorkerInfo,
  updateServiceSettings,
  updateAcceptStatus,
  getCertificates
};
