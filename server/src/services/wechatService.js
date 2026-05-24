const axios = require('axios');
const config = require('../config');

const getWechatSession = async (code, type = 'user') => {
  const appConfig = type === 'user' ? config.wechat.user : config.wechat.worker;

  const url = 'https://api.weixin.qq.com/sns/jscode2session';
  const params = {
    appid: appConfig.appid,
    secret: appConfig.secret,
    js_code: code,
    grant_type: 'authorization_code'
  };

  try {
    const response = await axios.get(url, { params });
    const { data } = response;

    if (data.errcode) {
      throw new Error(data.errmsg || '微信登录失败');
    }

    return data;
  } catch (error) {
    console.error('微信登录错误:', error);
    throw error;
  }
};

const getAccessToken = async (type = 'user') => {
  const appConfig = type === 'user' ? config.wechat.user : config.wechat.worker;

  const url = 'https://api.weixin.qq.com/cgi-bin/token';
  const params = {
    grant_type: 'client_credential',
    appid: appConfig.appid,
    secret: appConfig.secret
  };

  try {
    const response = await axios.get(url, { params });
    const { data } = response;

    if (data.errcode) {
      throw new Error(data.errmsg || '获取access_token失败');
    }

    return data.access_token;
  } catch (error) {
    console.error('获取access_token错误:', error);
    throw error;
  }
};

const sendSubscribeMessage = async (openid, templateId, data, page, type = 'user') => {
  try {
    const accessToken = await getAccessToken(type);
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;

    const body = {
      touser: openid,
      template_id: templateId,
      page,
      data
    };

    const response = await axios.post(url, body);

    if (response.data.errcode !== 0) {
      console.error('发送订阅消息失败:', response.data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('发送订阅消息错误:', error);
    return false;
  }
};

const getPhoneNumber = async (code, type = 'user') => {
  try {
    const accessToken = await getAccessToken(type);
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;

    const response = await axios.post(url, { code });

    if (response.data.errcode !== 0) {
      throw new Error(response.data.errmsg || '获取手机号失败');
    }

    return response.data.phone_info;
  } catch (error) {
    console.error('获取手机号错误:', error);
    throw error;
  }
};

module.exports = {
  getWechatSession,
  getAccessToken,
  sendSubscribeMessage,
  getPhoneNumber
};
