const { api, util } = require('../../utils/api.js');
const config = require('../../utils/config.js');

Page({
  data: {
    tabs: [
      { key: '', name: '全部' },
      { key: 'hall', name: '抢单大厅' },
      { key: 'my', name: '我的订单' }
    ],
    currentTab: '',
    orderList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadOrderList(true);
  },

  onShow() {
    if (getApp().globalData.token) {
      this.loadOrderList(true);
    }
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      currentTab: key,
      page: 1,
      orderList: [],
      hasMore: true
    });
    this.loadOrderList(true);
  },

  async loadOrderList(refresh = false) {
    if (this.data.loading) return;
    if (!this.data.hasMore && !refresh) return;

    this.setData({ loading: true });

    try {
      let res;
      if (this.data.currentTab === 'hall') {
        res = await api.order.getHall(this.data.page, this.data.pageSize);
      } else if (this.data.currentTab === 'my') {
        res = await api.order.getMyOrders(this.data.page, this.data.pageSize);
      } else {
        res = await api.order.getMyOrders(this.data.page, this.data.pageSize);
      }

      const list = res.data.list || res.data || [];
      const formattedList = list.map(order => ({
        ...order,
        statusText: config.orderStatusMap[order.status] || '未知',
        statusColor: config.orderStatusColorMap[order.status] || '#999'
      }));

      this.setData({
        orderList: refresh ? formattedList : [...this.data.orderList, ...formattedList],
        hasMore: list.length >= this.data.pageSize,
        page: refresh ? 2 : this.data.page + 1,
        loading: false
      });
    } catch (err) {
      console.error('加载订单列表失败:', err);
      this.setData({ loading: false });
    }
  },

  async acceptOrder(e) {
    const id = e.currentTarget.dataset.id;
    util.showModal('确定要抢这个订单吗？').then(confirm => {
      if (confirm) {
        this.doAccept(id);
      }
    });
  },

  async doAccept(id) {
    try {
      util.showLoading('抢单中...');
      await api.order.accept(id);
      util.hideLoading();
      util.showToast('抢单成功', 'success');
      this.loadOrderList(true);
    } catch (err) {
      util.hideLoading();
      util.showToast(err.message || '抢单失败');
    }
  },

  goToOrderDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    });
  },

  navigateToAddress(e) {
    const order = e.currentTarget.dataset.order;
    wx.openLocation({
      latitude: order.latitude,
      longitude: order.longitude,
      name: order.address_info.name + ' - ' + order.address_info.phone,
      address: order.address_info.province + order.address_info.city + order.address_info.district + order.address_info.detail,
      scale: 18
    });
  },

  callUser(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.loadOrderList(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    this.loadOrderList();
  }
});
