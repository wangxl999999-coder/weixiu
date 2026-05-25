const { api, wxApi, util } = require('../../utils/api.js');
const config = require('../../utils/config.js');

Page({
  data: {
    workerInfo: null,
    todayIncome: '0.00',
    todayOrders: 0,
    monthIncome: '0.00',
    monthOrders: 0,
    status: 0,
    statusText: '待审核',
    statusColor: '#faad14',
    loading: true
  },

  onLoad() {
    this.loadWorkerInfo();
    this.loadIncomeStats();
  },

  onShow() {
    if (getApp().globalData.token) {
      this.loadWorkerInfo();
      this.loadIncomeStats();
    }
    this.setData({ loading: false });
  },

  async loadWorkerInfo() {
    try {
      const res = await api.worker.getInfo();
      const workerInfo = res.data;
      this.setData({
        workerInfo,
        status: workerInfo.status,
        statusText: config.workerStatusMap[workerInfo.status] || '未知',
        statusColor: workerInfo.status === 1 ? '#52c41a' : workerInfo.status === 2 ? '#ff4d4f' : '#faad14'
      });
      getApp().setUserInfo(workerInfo);
    } catch (err) {
      console.error('加载师傅信息失败:', err);
    }
  },

  async loadIncomeStats() {
    try {
      const res = await api.wallet.getIncomeStats('today');
      if (res.data) {
        this.setData({
          todayIncome: util.formatMoney(res.data.income || 0),
          todayOrders: res.data.order_count || 0
        });
      }
      const monthRes = await api.wallet.getIncomeStats('month');
      if (monthRes.data) {
        this.setData({
          monthIncome: util.formatMoney(monthRes.data.income || 0),
          monthOrders: monthRes.data.order_count || 0
        });
      }
    } catch (err) {
      console.error('加载收入统计失败:', err);
    }
  },

  goToOrderHall() {
    wx.switchTab({ url: '/pages/order-hall/order-hall' });
  },

  goToMyOrders() {
    wx.switchTab({ url: '/pages/order-hall/order-hall' });
  },

  goToWallet() {
    wx.switchTab({ url: '/pages/wallet/wallet' });
  },

  goToRegistration() {
    wx.navigateTo({ url: '/pages/registration/registration' });
  },

  goToServiceSetting() {
    wx.navigateTo({ url: '/pages/service-setting/service-setting' });
  },

  callUser(e) {
    const phone = e.currentTarget.dataset.phone;
    wxApi.makePhoneCall(phone);
  }
});
