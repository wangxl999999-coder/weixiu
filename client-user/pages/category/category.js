const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    categories: [],
    currentCategory: null,
    services: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad(options) {
    this.loadCategories(options.category_id);
  },

  async loadCategories(categoryId) {
    try {
      const res = await api.home.getCategories();
      const categories = res.data.list || res.data || [];
      this.setData({ categories });

      if (categoryId) {
        const category = categories.find(c => c.id == categoryId);
        this.onCategoryTap({ currentTarget: { dataset: { id: categoryId } } });
      } else if (categories.length > 0) {
        this.onCategoryTap({ currentTarget: { dataset: { id: categories[0].id } } });
      }
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  },

  async onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    const category = this.data.categories.find(c => c.id == id);
    
    this.setData({
      currentCategory: category,
      page: 1,
      hasMore: true,
      services: []
    });

    this.loadServices();
  },

  async loadServices() {
    if (this.data.loading || !this.data.hasMore) return;
    
    this.setData({ loading: true });
    util.showLoading();

    try {
      const res = await api.home.getServices({
        category_id: this.data.currentCategory.id,
        page: this.data.page,
        pageSize: this.data.pageSize
      });

      const services = res.data.list || res.data || [];
      this.setData({
        services: this.data.page === 1 ? services : [...this.data.services, ...services],
        hasMore: services.length === this.data.pageSize,
        page: this.data.page + 1
      });
    } catch (err) {
      console.error('加载服务失败:', err);
      util.showToast('加载失败');
    } finally {
      this.setData({ loading: false });
      util.hideLoading();
    }
  },

  goToServiceDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?id=${id}`
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadServices();
    }
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      services: []
    });
    this.loadServices().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
