const api = require('../../utils/api.js');
const util = require('../../utils/util.js');
const config = require('../../utils/config.js');

Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    statusMap: config.orderStatusMap,
    showExtraConfirm: false,
    currentExtra: null,
    photoList: [],
    evaluation: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrderDetail();
    }
  },

  onShow() {
    if (this.data.orderId) {
      this.loadOrderDetail();
    }
  },

  async loadOrderDetail() {
    try {
      const res = await api.order.getDetail(this.data.orderId);
      const order = res.data;
      order.statusText = this.data.statusMap[order.status]?.text || '未知';
      order.statusColor = this.data.statusMap[order.status]?.color || '#999';
      
      this.setData({
        order,
        photoList: order.photos || [],
        evaluation: order.evaluation || null
      });
    } catch (err) {
      console.error('加载订单详情失败:', err);
      util.showToast('加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  callWorker() {
    if (this.data.order.worker?.phone) {
      api.makePhoneCall(this.data.order.worker.phone);
    }
  },

  callUserService() {
    api.makePhoneCall('400-000-0000');
  },

  cancelOrder() {
    util.showModal('确定要取消该订单吗？').then(confirm => {
      if (confirm) {
        this.doCancel();
      }
    });
  },

  async doCancel() {
    try {
      await api.order.cancel(this.data.orderId, '用户取消');
      util.showToast('取消成功', 'success');
      this.loadOrderDetail();
    } catch (err) {
      console.error('取消订单失败:', err);
    }
  },

  confirmOrder() {
    util.showModal('确认服务已完成？确认后可进行评价。').then(confirm => {
      if (confirm) {
        this.doConfirm();
      }
    });
  },

  async doConfirm() {
    try {
      await api.order.confirm(this.data.orderId);
      util.showToast('确认成功', 'success');
      wx.navigateTo({
        url: `/pages/evaluation/evaluation?order_id=${this.data.orderId}`
      });
    } catch (err) {
      console.error('确认订单失败:', err);
    }
  },

  applyRefund() {
    wx.navigateTo({
      url: `/pages/complaint/complaint?order_id=${this.data.orderId}&type=refund`
    });
  },

  showExtraConfirm(e) {
    const id = e.currentTarget.dataset.id;
    const extra = this.data.order.extras.find(e => e.id == id);
    this.setData({
      showExtraConfirm: true,
      currentExtra: extra
    });
  },

  hideExtraConfirm() {
    this.setData({ showExtraConfirm: false, currentExtra: null });
  },

  async confirmExtra() {
    try {
      await api.order.confirmExtra(this.data.currentExtra.id, true);
      util.showToast('确认成功', 'success');
      this.setData({ showExtraConfirm: false, currentExtra: null });
      this.loadOrderDetail();
    } catch (err) {
      console.error('确认增项失败:', err);
    }
  },

  async rejectExtra() {
    try {
      await api.order.confirmExtra(this.data.currentExtra.id, false);
      util.showToast('已拒绝');
      this.setData({ showExtraConfirm: false, currentExtra: null });
      this.loadOrderDetail();
    } catch (err) {
      console.error('拒绝增项失败:', err);
    }
  },

  previewPhoto(e) {
    const urls = this.data.photoList.map(p => p.image_url);
    const current = e.currentTarget.dataset.src;
    api.previewImage(urls, current);
  },

  goToEvaluation() {
    wx.navigateTo({
      url: `/pages/evaluation/evaluation?order_id=${this.data.orderId}`
    });
  },

  goToComplaint() {
    wx.navigateTo({
      url: `/pages/complaint/complaint?order_id=${this.data.orderId}`
    });
  },

  navigateToAddress() {
    if (this.data.order.address_info?.latitude && this.data.order.address_info?.longitude) {
      api.navigateToLocation(
        this.data.order.address_info.latitude,
        this.data.order.address_info.longitude,
        this.data.order.address_info.detail
      );
    }
  },

  onShareAppMessage() {
    return {
      title: '家政维修 - 专业的上门服务',
      path: '/pages/index/index'
    };
  }
});
