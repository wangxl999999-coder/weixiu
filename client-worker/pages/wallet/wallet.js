const { api, util } = require('../../utils/api.js');

Page({
  data: {
    wallet: null,
    loading: true,
    records: [],
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadWallet();
    this.loadRecords(true);
  },

  onShow() {
    if (getApp().globalData.token) {
      this.loadWallet();
      this.loadRecords(true);
    }
  },

  async loadWallet() {
    try {
      const res = await api.wallet.getInfo();
      const wallet = res.data;
      this.setData({
        wallet: {
          ...wallet,
          balance: util.formatMoney(wallet.balance || 0),
          frozen_balance: util.formatMoney(wallet.frozen_balance || 0),
          total_income: util.formatMoney(wallet.total_income || 0),
          total_withdraw: util.formatMoney(wallet.total_withdraw || 0)
        },
        loading: false
      });
    } catch (err) {
      console.error('加载钱包信息失败:', err);
      this.setData({ loading: false });
    }
  },

  async loadRecords(refresh = false) {
    if (!this.data.hasMore && !refresh) return;

    try {
      const res = await api.wallet.getRecords(this.data.page, this.data.pageSize);
      const list = (res.data.list || res.data || []).map(record => ({
        ...record,
        amount: util.formatMoney(record.amount),
        created_at: util.formatDate(record.created_at)
      }));

      this.setData({
        records: refresh ? list : [...this.data.records, ...list],
        hasMore: list.length >= this.data.pageSize,
        page: refresh ? 2 : this.data.page + 1
      });
    } catch (err) {
      console.error('加载钱包记录失败:', err);
    }
  },

  goToWithdraw() {
    wx.navigateTo({ url: '/pages/withdraw/withdraw' });
  },

  goToIncome() {
    wx.navigateTo({ url: '/pages/income/income' });
  },

  onReachBottom() {
    this.loadRecords();
  }
});
