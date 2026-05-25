const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    tabs: [
      { key: 1, name: '可使用' },
      { key: 2, name: '已使用' },
      { key: 3, name: '已过期' }
    ],
    currentTab: 1,
    couponList: [],
    loading: true
  },

  onLoad() {
    this.loadCouponList();
  },

  onShow() {
    if (getApp().globalData.token) {
      this.loadCouponList();
    }
  },

  async loadCouponList() {
    if (!getApp().checkLogin()) {
      this.setData({ loading: false });
      return;
    }

    try {
      const res = await api.coupon.getUserCoupons({ status: this.data.currentTab });
      this.setData({
        couponList: res.data.list || res.data || [],
        loading: false
      });
    } catch (err) {
      console.error('加载优惠券失败:', err);
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      currentTab: key,
      couponList: []
    });
    this.loadCouponList();
  },

  goToHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onShareAppMessage() {
    return {
      title: '家政维修 - 领取优惠券',
      path: '/pages/index/index'
    };
  }
});
