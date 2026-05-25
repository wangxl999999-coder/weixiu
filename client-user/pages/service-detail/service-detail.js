const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    serviceId: null,
    service: null,
    workerList: [],
    loading: true,
    selectedWorker: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ serviceId: options.id });
      this.loadServiceDetail();
    }
  },

  async loadServiceDetail() {
    try {
      const res = await api.home.getServiceDetail(this.data.serviceId);
      const service = res.data;
      this.setData({ service });
      this.loadNearbyWorkers();
    } catch (err) {
      console.error('加载服务详情失败:', err);
      util.showToast('加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadNearbyWorkers() {
    try {
      const app = getApp();
      const res = await api.home.getNearbyWorkers({
        service_id: this.data.serviceId,
        limit: 10,
        latitude: app.globalData.location?.latitude,
        longitude: app.globalData.location?.longitude
      });
      this.setData({
        workerList: res.data.list || res.data || []
      });
    } catch (err) {
      console.error('加载附近师傅失败:', err);
    }
  },

  selectWorker(e) {
    const id = e.currentTarget.dataset.id;
    const worker = this.data.workerList.find(w => w.id == id);
    this.setData({ selectedWorker: worker });
  },

  goToBooking() {
    if (!getApp().checkLogin()) return;

    const workerId = this.data.selectedWorker?.id || '';
    wx.navigateTo({
      url: `/pages/booking/booking?service_id=${this.data.serviceId}&worker_id=${workerId}`
    });
  },

  onPreviewImage(e) {
    const urls = this.data.service.images || [];
    const current = e.currentTarget.dataset.src;
    api.previewImage(urls, current);
  },

  callWorker(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      api.makePhoneCall(phone);
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.service?.name || '家政维修服务',
      path: `/pages/service-detail/service-detail?id=${this.data.serviceId}`
    };
  }
});
