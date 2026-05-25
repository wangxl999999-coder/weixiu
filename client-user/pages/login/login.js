const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    phone: '',
    code: '',
    submitting: false
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  async wxLogin() {
    try {
      util.showLoading('登录中...');
      const res = await api.wxLogin();
      util.hideLoading();
      
      if (res.user && res.user.phone) {
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        util.showToast('请完善信息');
      }
    } catch (err) {
      util.hideLoading();
      console.error('微信登录失败:', err);
      util.showToast('登录失败，请重试');
    }
  },

  async getPhoneNumber(e) {
    if (!e.detail.code) return;
    
    try {
      util.showLoading('登录中...');
      const res = await api.login.loginByPhone('', e.detail.code);
      util.hideLoading();
      
      if (res.data && res.data.token) {
        getApp().setToken(res.data.token);
        if (res.data.user) {
          getApp().setUserInfo(res.data.user);
        }
        wx.switchTab({ url: '/pages/index/index' });
      }
    } catch (err) {
      util.hideLoading();
      console.error('手机号登录失败:', err);
      util.showToast('登录失败，请重试');
    }
  },

  async phoneLogin() {
    if (!this.data.phone) {
      util.showToast('请输入手机号');
      return;
    }

    try {
      util.showLoading('登录中...');
      const res = await api.login.loginByPhone(this.data.phone, '');
      util.hideLoading();
      
      if (res.data && res.data.token) {
        getApp().setToken(res.data.token);
        if (res.data.user) {
          getApp().setUserInfo(res.data.user);
        }
        wx.switchTab({ url: '/pages/index/index' });
      }
    } catch (err) {
      util.hideLoading();
      console.error('手机号登录失败:', err);
      util.showToast('登录失败，请重试');
    }
  }
});
