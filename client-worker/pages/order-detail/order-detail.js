const { api, wxApi, util } = require('../../utils/api.js');
const config = require('../../utils/config.js');

Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    showExtraModal: false,
    showPhotoModal: false,
    extraName: '',
    extraPrice: '',
    extraQuantity: 1,
    extraDescription: '',
    photoType: 1,
    photoList: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrderDetail();
    }
  },

  async loadOrderDetail() {
    try {
      const res = await api.order.getDetail(this.data.orderId);
      const order = res.data;
      this.setData({
        order: {
          ...order,
          statusText: config.orderStatusMap[order.status] || '未知',
          statusColor: config.orderStatusColorMap[order.status] || '#999'
        },
        photoList: order.photos || [],
        loading: false
      });
    } catch (err) {
      console.error('加载订单详情失败:', err);
      this.setData({ loading: false });
    }
  },

  async updateStatus(status) {
    try {
      util.showLoading('处理中...');
      await api.order.updateStatus(this.data.orderId, status);
      util.hideLoading();
      util.showToast('操作成功', 'success');
      this.loadOrderDetail();
    } catch (err) {
      util.hideLoading();
      util.showToast(err.message || '操作失败');
    }
  },

  startService() {
    util.showModal('确定要开始服务吗？').then(confirm => {
      if (confirm) {
        this.updateStatus(2);
      }
    });
  },

  completeService() {
    util.showModal('确定要完成服务吗？').then(confirm => {
      if (confirm) {
        this.updateStatus(3);
      }
    });
  },

  showExtraForm() {
    this.setData({ showExtraModal: true });
  },

  hideExtraModal() {
    this.setData({
      showExtraModal: false,
      extraName: '',
      extraPrice: '',
      extraQuantity: 1,
      extraDescription: ''
    });
  },

  onExtraNameInput(e) {
    this.setData({ extraName: e.detail.value });
  },

  onExtraPriceInput(e) {
    this.setData({ extraPrice: e.detail.value });
  },

  onExtraQuantityInput(e) {
    this.setData({ extraQuantity: e.detail.value });
  },

  onExtraDescInput(e) {
    this.setData({ extraDescription: e.detail.value });
  },

  async submitExtra() {
    if (!this.data.extraName) {
      util.showToast('请输入增项名称');
      return;
    }
    if (!this.data.extraPrice) {
      util.showToast('请输入增项价格');
      return;
    }

    try {
      util.showLoading('提交中...');
      await api.order.addExtra(this.data.orderId, {
        name: this.data.extraName,
        price: parseFloat(this.data.extraPrice) * 100,
        quantity: parseInt(this.data.extraQuantity),
        description: this.data.extraDescription
      });
      util.hideLoading();
      util.showToast('提交成功', 'success');
      this.hideExtraModal();
      this.loadOrderDetail();
    } catch (err) {
      util.hideLoading();
      util.showToast(err.message || '提交失败');
    }
  },

  showPhotoForm() {
    this.setData({ showPhotoModal: true });
  },

  hidePhotoModal() {
    this.setData({
      showPhotoModal: false,
      photoType: 1
    });
  },

  selectPhotoType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ photoType: type });
  },

  async uploadPhoto() {
    try {
      const files = await wxApi.chooseImage(1);
      util.showLoading('上传中...');
      const uploadRes = await wxApi.uploadFile(files[0]);
      await api.order.uploadPhoto(this.data.orderId, {
        image_url: uploadRes.url,
        type: this.data.photoType
      });
      util.hideLoading();
      util.showToast('上传成功', 'success');
      this.hidePhotoModal();
      this.loadOrderDetail();
    } catch (err) {
      util.hideLoading();
      if (err.errMsg !== 'chooseMedia:fail cancel') {
        util.showToast('上传失败');
      }
    }
  },

  callUser() {
    if (this.data.order && this.data.order.user_phone) {
      wxApi.makePhoneCall(this.data.order.user_phone);
    }
  },

  navigateToAddress() {
    if (this.data.order && this.data.order.address_info) {
      const addr = this.data.order.address_info;
      wxApi.openLocation(addr.latitude, addr.longitude, addr.name + ' - ' + addr.phone, addr.province + addr.city + addr.district + addr.detail);
    }
  },

  previewPhoto(e) {
    const src = e.currentTarget.dataset.src;
    const urls = this.data.photoList.map(p => p.image_url);
    wx.previewImage({ current: src, urls });
  }
});
