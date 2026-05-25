const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    serviceId: '',
    workerId: '',
    service: null,
    worker: null,
    addressList: [],
    selectedAddress: null,
    couponList: [],
    selectedCoupon: null,
    remark: '',
    appointmentTime: '',
    showTimePicker: false,
    minDate: '',
    priceDetail: {
      basePrice: 0,
      couponDiscount: 0,
      totalPrice: 0
    },
    submitting: false
  },

  onLoad(options) {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    
    this.setData({
      serviceId: options.service_id || '',
      workerId: options.worker_id || '',
      minDate: util.formatDate(tomorrow)
    });

    this.loadServiceDetail();
    if (this.data.workerId) {
      this.loadWorkerDetail();
    }
    this.loadAddressList();
  },

  onShow() {
    this.loadAddressList();
  },

  async loadServiceDetail() {
    try {
      const res = await api.home.getServiceDetail(this.data.serviceId);
      const service = res.data;
      this.setData({
        service,
        'priceDetail.basePrice': service.base_price,
        'priceDetail.totalPrice': service.base_price
      });
    } catch (err) {
      console.error('加载服务失败:', err);
    }
  },

  async loadWorkerDetail() {
    try {
      const res = await api.home.getNearbyWorkers({ worker_id: this.data.workerId, limit: 1 });
      const list = res.data.list || res.data || [];
      if (list.length > 0) {
        this.setData({ worker: list[0] });
      }
    } catch (err) {
      console.error('加载师傅信息失败:', err);
    }
  },

  async loadAddressList() {
    if (!getApp().checkLogin()) return;
    try {
      const res = await api.address.getList();
      const addresses = res.data.list || res.data || [];
      this.setData({
        addressList: addresses,
        selectedAddress: this.data.selectedAddress || addresses.find(a => a.is_default) || addresses[0] || null
      });

      if (this.data.selectedAddress && this.data.serviceId) {
        this.loadAvailableCoupons();
      }
    } catch (err) {
      console.error('加载地址失败:', err);
    }
  },

  async loadAvailableCoupons() {
    try {
      const res = await api.coupon.getAvailableCoupons(this.data.serviceId);
      this.setData({
        couponList: res.data.list || res.data || []
      });
    } catch (err) {
      console.error('加载优惠券失败:', err);
    }
  },

  selectAddress(e) {
    const id = e.currentTarget.dataset.id;
    const address = this.data.addressList.find(a => a.id == id);
    this.setData({ selectedAddress: address });
  },

  selectCoupon(e) {
    const id = e.currentTarget.dataset.id;
    const coupon = this.data.couponList.find(c => c.id == id);
    let discount = 0;
    
    if (coupon) {
      if (coupon.type === 1) {
        discount = coupon.value;
      } else if (coupon.type === 2) {
        discount = this.data.priceDetail.basePrice * (1 - coupon.value / 10);
      }
    }

    this.setData({
      selectedCoupon: coupon,
      'priceDetail.couponDiscount': discount,
      'priceDetail.totalPrice': Math.max(0, this.data.priceDetail.basePrice - discount)
    });
  },

  addAddress() {
    wx.navigateTo({
      url: '/pages/address-edit/address-edit'
    });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onTimeInput(e) {
    this.setData({ appointmentTime: e.detail.value });
  },

  chooseTime() {
    this.setData({ showTimePicker: true });
  },

  onTimePickerChange(e) {
    const time = e.detail;
    this.setData({
      appointmentTime: time,
      showTimePicker: false
    });
  },

  async submitOrder() {
    if (!this.data.selectedAddress) {
      util.showToast('请选择服务地址');
      return;
    }

    if (!this.data.appointmentTime) {
      util.showToast('请选择预约时间');
      return;
    }

    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      const res = await api.order.create({
        service_id: this.data.serviceId,
        worker_id: this.data.workerId,
        address_id: this.data.selectedAddress.id,
        coupon_id: this.data.selectedCoupon?.id,
        appointment_time: this.data.appointmentTime,
        remark: this.data.remark,
        pay_price: this.data.priceDetail.totalPrice
      });

      const orderId = res.data.order_id;
      const payment = await api.payment.create({
        order_id: orderId,
        pay_type: 1,
        amount: this.data.priceDetail.totalPrice
      });

      await api.wxPay(payment.data);

      wx.showToast({ title: '下单成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?id=${orderId}`
        });
      }, 1500);
    } catch (err) {
      console.error('提交订单失败:', err);
      if (err.errMsg === 'requestPayment:fail cancel') {
        util.showToast('支付已取消');
      } else {
        util.showToast(err.message || '下单失败');
      }
    } finally {
      this.setData({ submitting: false });
    }
  },

  goToAddressList() {
    wx.navigateTo({
      url: '/pages/address/address?select=1'
    });
  }
});
