const { api, util } = require('../../utils/api.js');

Page({
  data: {
    tabs: [
      { key: 'week', name: '本周' },
      { key: 'month', name: '本月' },
      { key: 'year', name: '本年' }
    ],
    currentTab: 'week',
    totalIncome: '0.00',
    totalOrders: 0,
    platformFee: '0.00',
    actualIncome: '0.00',
    records: [],
    loading: true
  },

  onLoad() {
    this.loadStats();
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ currentTab: key });
    this.loadStats();
  },

  async loadStats() {
    this.setData({ loading: true });
    try {
      const res = await api.wallet.getIncomeStats(this.data.currentTab);
      const data = res.data || {};
      
      this.setData({
        totalIncome: util.formatMoney(data.total_income || 0),
        totalOrders: data.order_count || 0,
        platformFee: util.formatMoney(data.platform_fee || 0),
        actualIncome: util.formatMoney(data.actual_income || 0),
        records: (data.records || []).map(record => ({
          ...record,
          amount: util.formatMoney(record.amount),
          platform_fee: util.formatMoney(record.platform_fee || 0),
          created_at: util.formatDate(record.created_at)
        })),
        loading: false
      });
    } catch (err) {
      console.error('加载收入统计失败:', err);
      this.setData({ loading: false });
    }
  }
});
