const { api, wxApi, util } = require('../../utils/api.js');
const config = require('../../utils/config.js');

Page({
  data: {
    workerInfo: null,
    status: 0,
    statusText: '',
    statusColor: '',
    deposit: '0.00',
    orderCount: 0,
    rating: '5.0',
    loading: true
  },

  onLoad() {
    this.loadWorkerInfo();
  },

  onShow() {
    if (getApp().globalData.token) {
      this.loadWorkerInfo();
    }
    this.setData({ loading: false });
  },

  async loadWorkerInfo() {
    try {
      const res = await api.worker.getInfo();
      const info = res.data;
      
      if (info) {
        this.setData({
          workerInfo: info,
          status: info.status,
          statusText: config.workerStatusMap[info.status] || '未知',
          statusColor: info.status === 1 ? '#52c41a' : info.status === 2 ? '#ff4d4f' : '#faad14',
          deposit: util.formatMoney(info.deposit || 0),
          orderCount: info.order_count || 0,
          rating: info.rating || '5.0'
        });
      }
    } catch (err) {
      console.error('加载师傅信息失败:', err);
    }
  },

  goToRegistration() {
    wx.navigateTo({ url: '/pages/registration/registration' });
  },

  goToServiceSetting() {
    wx.navigateTo({ url: '/pages/service-setting/service-setting' });
  },

  goToIncome() {
    wx.navigateTo({ url: '/pages/income/income' });
  },

  goToWallet() {
    wx.switchTab({ url: '/pages/wallet/wallet' });
  },

  async updateAvatar() {
    try {
      const files = await wxApi.chooseImage(1);
      util.showLoading('上传中...');
      const uploadRes = await wxApi.uploadFile(files[0]);
      await api.worker.updateInfo({ avatar: uploadRes.url });
      util.hideLoading();
      util.showToast('修改成功', 'success');
      this.loadWorkerInfo();
    } catch (err) {
      util.hideLoading();
      if (err.errMsg !== 'chooseMedia:fail cancel') {
        util.showToast('修改失败');
      }
    }
  },

  editName() {
    wx.showModal({
      title: '修改姓名',
      editable: true,
      placeholderText: '请输入真实姓名',
      content: this.data.workerInfo.name || '',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            util.showLoading('保存中...');
            await api.worker.updateInfo({ name: res.content });
            util.hideLoading();
            util.showToast('修改成功', 'success');
            this.loadWorkerInfo();
          } catch (err) {
            util.hideLoading();
            util.showToast('修改失败');
          }
        }
      }
    });
  },

  callService() {
    wxApi.makePhoneCall('400-000-0000');
  },

  logout() {
    util.showModal('确定要退出登录吗？').then(confirm => {
      if (confirm) {
        getApp().logout();
        wx.redirectTo({ url: '/pages/registration/registration' });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '家政维修师傅端 - 加入我们',
      path: '/pages/registration/registration'
    };
  }
});
