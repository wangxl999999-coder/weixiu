const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    evaluationList: [],
    loading: true
  },

  onLoad() {
    this.loadEvaluations();
  },

  onShow() {
    if (getApp().globalData.token) {
      this.loadEvaluations();
    }
  },

  async loadEvaluations() {
    if (!getApp().checkLogin()) {
      this.setData({ loading: false });
      return;
    }

    try {
      const res = await api.evaluation.getUserEvaluations();
      this.setData({
        evaluationList: res.data.list || res.data || [],
        loading: false
      });
    } catch (err) {
      console.error('加载评价列表失败:', err);
      this.setData({ loading: false });
    }
  },

  goToOrderDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    });
  }
});
