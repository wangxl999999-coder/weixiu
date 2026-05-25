const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    addressList: [],
    loading: true,
    selectMode: false,
    selectedId: null
  },

  onLoad(options) {
    this.setData({ selectMode: options.select === '1' });
  },

  onShow() {
    if (getApp().globalData.token) {
      this.loadAddressList();
    }
  },

  async loadAddressList() {
    try {
      const res = await api.address.getList();
      this.setData({
        addressList: res.data.list || res.data || [],
        loading: false
      });
    } catch (err) {
      console.error('加载地址失败:', err);
      this.setData({ loading: false });
    }
  },

  addAddress() {
    if (!getApp().checkLogin()) return;
    wx.navigateTo({
      url: '/pages/address-edit/address-edit'
    });
  },

  editAddress(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/address-edit/address-edit?id=${id}`
    });
  },

  async deleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    util.showModal('确定要删除该地址吗？').then(confirm => {
      if (confirm) {
        this.doDelete(id);
      }
    });
  },

  async doDelete(id) {
    try {
      await api.address.delete(id);
      util.showToast('删除成功', 'success');
      this.loadAddressList();
    } catch (err) {
      console.error('删除地址失败:', err);
    }
  },

  async setDefault(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await api.address.setDefault(id);
      util.showToast('设置成功', 'success');
      this.loadAddressList();
    } catch (err) {
      console.error('设置默认地址失败:', err);
    }
  },

  selectAddress(e) {
    if (!this.data.selectMode) return;
    const id = e.currentTarget.dataset.id;
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage && prevPage.setSelectedAddress) {
      const address = this.data.addressList.find(a => a.id == id);
      prevPage.setSelectedAddress(address);
    }
    wx.navigateBack();
  }
});
