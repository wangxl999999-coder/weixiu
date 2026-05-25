const api = require('../../utils/api.js');
const util = require('../../utils/util.js');
const config = require('../../utils/config.js');

Page({
  data: {
    tabs: [
      { key: '', name: '全部' },
      { key: 0, name: '待接单' },
      { key: 1, name: '进行中' },
      { key: 4, name: '已完成' }
    ],
    currentTab: '',
    orders: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    statusMap: config.orderStatusMap
  },

  onLoad(options) {
    if (options.status !== undefined) {
      this.setData({ currentTab: options.status });
    }
    this.loadOrders();
  },

  onShow() {
    if (this.data.orders.length > 0) {
      this.setData({ page: 1, hasMore: true, orders: [] });
      this.loadOrders();
    }
  },

  async loadOrders() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const res = await api.order.getMyOrders({
        status: this.data.currentTab,
        page: this.data.page,
        pageSize: this.data.pageSize
      });

      const orders = (res.data.list || res.data || []).map(order => ({
        ...order,
        statusText: this.data.statusMap[order.status]?.text || '未知',
        statusColor: this.data.statusMap[order.status]?.color || '#999',
        payStatusText: config.payStatusMap[order.pay_status]?.text || '',
        payStatusColor: config.payStatusMap[order.pay_status]?.color || '#999'
      }));

      this.setData({
        orders: this.data.page === 1 ? orders : [...this.data.orders, ...orders],
        hasMore: orders.length === this.data.pageSize,
        page: this.data.page + 1
      });
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      currentTab: key,
      page: 1,
      hasMore: true,
      orders: []
    });
    this.loadOrders();
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    });
  },

  callWorker(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      api.makePhoneCall(phone);
    }
  },

  cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    util.showModal('确定要取消该订单吗？').then(confirm => {
      if (confirm) {
        this.doCancel(id);
      }
    });
  },

  async doCancel(id) {
    try {
      await api.order.cancel(id, '用户取消');
      util.showToast('取消成功', 'success');
      this.setData({ page: 1, hasMore: true, orders: [] });
      this.loadOrders();
    } catch (err) {
      console.error('取消订单失败:', err);
    }
  },

  confirmOrder(e) {
    const id = e.currentTarget.dataset.id;
    this.doConfirm(id);
  },

  async doConfirm(id) {
    try {
      await api.order.confirm(id);
      util.showToast('确认成功', 'success');
      wx.navigateTo({
        url: `/pages/evaluation/evaluation?order_id=${id}`
      });
    } catch (err) {
      console.error('确认订单失败:', err);
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrders();
    }
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      orders: []
    });
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
