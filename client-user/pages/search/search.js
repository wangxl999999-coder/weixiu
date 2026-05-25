const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    keyword: '',
    hotKeywords: ['空调维修', '洗衣机维修', '家电清洗', '水管维修', '电路维修'],
    serviceList: [],
    loading: false
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  async search() {
    const keyword = this.data.keyword.trim();
    if (!keyword) {
      util.showToast('请输入搜索关键词');
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await api.service.getList({ keyword, page: 1, pageSize: 50 });
      this.setData({
        serviceList: res.data.list || res.data || [],
        loading: false
      });
    } catch (err) {
      console.error('搜索失败:', err);
      this.setData({ loading: false });
    }
  },

  async searchByKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.search();
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?id=${id}`
    });
  },

  clearKeyword() {
    this.setData({
      keyword: '',
      serviceList: []
    });
  }
});
