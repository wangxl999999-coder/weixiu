const bcrypt = require('bcryptjs');
const db = require('../models');
const { success, error } = require('../utils/response');
const { generateToken } = require('../middleware/auth');
const { getWechatSession, getPhoneNumber } = require('../services/wechatService');

const loginByWechat = async (req, res) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return error(res, '缺少code参数', 400);
    }

    const session = await getWechatSession(code, 'user');

    let user = await db.User.findOne({ where: { openid: session.openid } });

    if (!user) {
      user = await db.User.create({
        openid: session.openid,
        unionid: session.unionid,
        nickname: userInfo?.nickName,
        avatar: userInfo?.avatarUrl,
        gender: userInfo?.gender
      });
    } else {
      if (userInfo) {
        await user.update({
          nickname: userInfo.nickName,
          avatar: userInfo.avatarUrl,
          gender: userInfo.gender
        });
      }
    }

    if (user.status !== 1) {
      return error(res, '账号已被禁用', 403);
    }

    const token = generateToken(user, 'user');

    success(res, {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender
      },
      sessionKey: session.session_key
    }, '登录成功');
  } catch (err) {
    console.error('用户登录错误:', err);
    error(res, err.message || '登录失败', 500);
  }
};

const updatePhone = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.currentUser.id;

    if (!code) {
      return error(res, '缺少code参数', 400);
    }

    const phoneInfo = await getPhoneNumber(code, 'user');

    await db.User.update(
      { phone: phoneInfo.phoneNumber },
      { where: { id: userId } }
    );

    success(res, { phone: phoneInfo.phoneNumber }, '手机号更新成功');
  } catch (err) {
    console.error('更新手机号错误:', err);
    error(res, err.message || '更新失败', 500);
  }
};

const getUserInfo = async (req, res) => {
  try {
    const user = req.currentUser;

    const couponCount = await db.UserCoupon.count({
      where: { user_id: user.id, status: 0 }
    });

    const orderCount = await db.Order.count({
      where: { user_id: user.id, status: { [db.Sequelize.Op.in]: [0, 1, 2, 3] } }
    });

    success(res, {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      gender: user.gender,
      couponCount,
      orderCount,
      createdAt: user.created_at
    });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    error(res, '获取失败', 500);
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const { nickname, avatar, gender } = req.body;
    const userId = req.currentUser.id;

    await db.User.update(
      { nickname, avatar, gender },
      { where: { id: userId } }
    );

    success(res, null, '更新成功');
  } catch (err) {
    console.error('更新用户信息错误:', err);
    error(res, '更新失败', 500);
  }
};

const loginByPhone = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return error(res, '手机号和验证码不能为空', 400);
    }

    const phoneInfo = await getPhoneNumber(code, 'user');
    if (phoneInfo.phoneNumber !== phone) {
      return error(res, '手机号验证失败', 400);
    }

    let user = await db.User.findOne({ where: { phone } });

    if (!user) {
      user = await db.User.create({
        phone,
        nickname: '用户' + phone.slice(-4)
      });
    }

    if (user.status !== 1) {
      return error(res, '账号已被禁用', 403);
    }

    const token = generateToken(user, 'user');

    success(res, {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender
      }
    }, '登录成功');
  } catch (err) {
    console.error('手机号登录错误:', err);
    error(res, err.message || '登录失败', 500);
  }
};

module.exports = {
  wxLogin: loginByWechat,
  loginByWechat,
  loginByPhone,
  updatePhone,
  getUserInfo,
  updateUserInfo
};
