const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    userInfo: null,
    orderCounts: {
      pending: 0,
      processing: 0,
      completed: 0
    },
    couponCount: 0,
    loading: true
  },

  onLoad() {
    this.loadUserInfo();
    this.loadOrderCounts();
    this.loadCouponCount();
  },

  onShow() {
    if (getApp().globalData.token) {
      this.loadUserInfo();
      this.loadOrderCounts();
      this.loadCouponCount();
    }
    this.setData({ loading: false });
  },

  async loadUserInfo() {
    try {
      const res = await api.login.getUserInfo();
      if (res.data) {
        this.setData({ userInfo: res.data });
        getApp().setUserInfo(res.data);
      }
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  },

  async loadOrderCounts() {
    try {
      const res = await api.order.getMyOrders({ page: 1, pageSize: 1 });
      const orders = res.data.list || res.data || [];
      this.setData({
        orderCounts: {
          pending: orders.filter(o => o.status === 0).length,
          processing: orders.filter(o => o.status === 1 || o.status === 2 || o.status === 3).length,
          completed: orders.filter(o => o.status === 4).length
        }
      });
    } catch (err) {
      console.error('加载订单数量失败:', err);
    }
  },

  async loadCouponCount() {
    try {
      const res = await api.coupon.getUserCoupons({ status: 1 });
      this.setData({
        couponCount: res.data.total || (res.data.list || []).length || 0
      });
    } catch (err) {
      console.error('加载优惠券数量失败:', err);
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goToOrders(e) {
    if (!getApp().checkLogin()) return;
    const status = e.currentTarget.dataset.status;
    wx.navigateTo({
      url: `/pages/order-list/order-list?status=${status}`
    });
  },

  goToCoupon() {
    if (!getApp().checkLogin()) return;
    wx.navigateTo({ url: '/pages/coupon/coupon' });
  },

  goToAddress() {
    if (!getApp().checkLogin()) return;
    wx.navigateTo({ url: '/pages/address/address' });
  },

  goToEvaluations() {
    if (!getApp().checkLogin()) return;
    wx.navigateTo({ url: '/pages/evaluation-list/evaluation-list' });
  },

  goToComplaint() {
    if (!getApp().checkLogin()) return;
    wx.navigateTo({ url: '/pages/complaint/complaint' });
  },

  editProfile() {
    if (!getApp().checkLogin()) return;
    wx.showActionSheet({
      itemList: ['修改昵称', '修改头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editNickname();
        } else if (res.tapIndex === 1) {
          this.editAvatar();
        }
      }
    });
  },

  editNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await api.login.updateUserInfo({ nickname: res.content });
            util.showToast('修改成功', 'success');
            this.loadUserInfo();
          } catch (err) {
            console.error('修改昵称失败:', err);
          }
        }
      }
    });
  },

  editAvatar() {
    api.chooseImage(1).then(async (files) => {
      try {
        const res = await api.uploadFile(files[0]);
        await api.login.updateUserInfo({ avatar: res.url });
        util.showToast('修改成功', 'success');
        this.loadUserInfo();
      } catch (err) {
        console.error('修改头像失败:', err);
        util.showToast('修改失败');
      }
    }).catch(() => {});
  },

  logout() {
    util.showModal('确定要退出登录吗？').then(confirm => {
      if (confirm) {
        getApp().logout();
        this.setData({ userInfo: null });
        util.showToast('已退出登录', 'success');
      }
    });
  },

  callService() {
    api.makePhoneCall('400-000-0000');
  },

  onShareAppMessage() {
    return {
      title: '家政维修 - 专业的上门服务',
      path: '/pages/index/index'
    };
  }
});
