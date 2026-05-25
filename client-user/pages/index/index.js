const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    banners: [],
    categories: [],
    flashSales: [],
    hotServices: [],
    nearbyWorkers: [],
    couponBanners: [],
    location: null,
    city: '定位中...',
    searchKeyword: ''
  },

  onLoad() {
    this.loadHomeData();
  },

  onShow() {
    const app = getApp();
    if (app.globalData.location) {
      this.setData({ location: app.globalData.location });
    }
    if (app.globalData.city) {
      this.setData({ city: app.globalData.city });
    }
  },

  onPullDownRefresh() {
    this.loadHomeData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadHomeData() {
    util.showLoading();
    try {
      const [homeRes, flashRes, workerRes, couponRes] = await Promise.all([
        api.home.getHomeData(),
        api.home.getFlashSales(),
        api.home.getNearbyWorkers({ limit: 5 }),
        api.home.getCouponBanners()
      ]);

      this.setData({
        banners: homeRes.data.banners || [],
        categories: homeRes.data.categories || [],
        hotServices: homeRes.data.hot_services || [],
        flashSales: flashRes.data.list || [],
        nearbyWorkers: workerRes.data.list || [],
        couponBanners: couponRes.data.list || []
      });
    } catch (err) {
      console.error('加载首页数据失败:', err);
      util.showToast('加载失败，请下拉刷新');
    } finally {
      util.hideLoading();
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm() {
    const keyword = this.data.searchKeyword.trim();
    if (keyword) {
      wx.navigateTo({
        url: `/pages/search/search?keyword=${encodeURIComponent(keyword)}`
      });
    }
  },

  goToCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/category/category?category_id=${id}`
    });
  },

  goToServiceDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?id=${id}`
    });
  },

  goToFlashSale() {
    wx.navigateTo({
      url: '/pages/flash-sale/flash-sale'
    });
  },

  goToWorkerDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/worker-list/worker-list?worker_id=${id}`
    });
  },

  goToCouponList() {
    wx.navigateTo({
      url: '/pages/coupon/coupon'
    });
  },

  onChooseLocation() {
    api.chooseLocation().then((res) => {
      this.setData({
        location: { latitude: res.latitude, longitude: res.longitude },
        city: res.name || res.address
      });
      getApp().globalData.location = {
        latitude: res.latitude,
        longitude: res.longitude
      };
      this.loadHomeData();
    }).catch(() => {});
  },

  onShareAppMessage() {
    return {
      title: '家政维修 - 专业的上门服务',
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});
