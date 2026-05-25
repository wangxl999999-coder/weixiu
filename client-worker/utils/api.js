const config = require('./config.js');

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = getApp().globalData.token;
    wx.request({
      url: config.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 0 || res.data.code === 200) {
            resolve(res.data);
          } else if (res.data.code === 401) {
            getApp().logout();
            wx.redirectTo({ url: '/pages/registration/registration' });
            reject(res.data);
          } else {
            reject(res.data);
          }
        } else {
          reject({ message: '网络错误' });
        }
      },
      fail: (err) => {
        reject({ message: '网络请求失败' });
      }
    });
  });
};

const api = {
  worker: {
    register(data) {
      return request({
        url: '/worker/auth/register',
        method: 'POST',
        data
      });
    },
    login(code, phone) {
      return request({
        url: '/worker/auth/login',
        method: 'POST',
        data: { code, phone }
      });
    },
    getInfo() {
      return request({
        url: '/worker/auth/info'
      });
    },
    updateInfo(data) {
      return request({
        url: '/worker/auth/update',
        method: 'PUT',
        data
      });
    },
    updateServiceSetting(data) {
      return request({
        url: '/worker/auth/service-setting',
        method: 'PUT',
        data
      });
    }
  },

  order: {
    getHall(page, pageSize) {
      return request({
        url: '/worker/order/hall',
        data: { page, pageSize }
      });
    },
    accept(id) {
      return request({
        url: '/worker/order/accept/' + id,
        method: 'POST'
      });
    },
    getMyOrders(page, pageSize, status) {
      return request({
        url: '/worker/order/my',
        data: { page, pageSize, status }
      });
    },
    getDetail(id) {
      return request({
        url: '/worker/order/' + id
      });
    },
    updateStatus(id, status) {
      return request({
        url: '/worker/order/status/' + id,
        method: 'PUT',
        data: { status }
      });
    },
    addExtra(id, data) {
      return request({
        url: '/worker/order/extra/' + id,
        method: 'POST',
        data
      });
    },
    uploadPhoto(id, data) {
      return request({
        url: '/worker/order/photo/' + id,
        method: 'POST',
        data
      });
    }
  },

  wallet: {
    getInfo() {
      return request({
        url: '/worker/wallet/info'
      });
    },
    getRecords(page, pageSize) {
      return request({
        url: '/worker/wallet/records',
        data: { page, pageSize }
      });
    },
    withdraw(data) {
      return request({
        url: '/worker/wallet/withdraw',
        method: 'POST',
        data
      });
    },
    getWithdrawList(page, pageSize) {
      return request({
        url: '/worker/wallet/withdraw-list',
        data: { page, pageSize }
      });
    },
    getIncomeStats(type) {
      return request({
        url: '/worker/wallet/income-stats',
        data: { type }
      });
    }
  }
};

const wxApi = {
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      });
    });
  },

  chooseImage(count) {
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: count || 1,
        mediaType: ['image'],
        success: (res) => {
          const files = res.tempFiles.map(f => f.tempFilePath);
          resolve(files);
        },
        fail: reject
      });
    });
  },

  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: config.baseUrl + '/common/upload',
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': 'Bearer ' + getApp().globalData.token
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          resolve(data);
        },
        fail: reject
      });
    });
  },

  makePhoneCall(phone) {
    wx.makePhoneCall({ phoneNumber: phone });
  },

  openLocation(latitude, longitude, name, address) {
    wx.openLocation({
      latitude,
      longitude,
      name: name || '',
      address: address || '',
      scale: 18
    });
  }
};

const util = {
  showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  hideLoading() {
    wx.hideLoading();
  },

  showToast(title, icon = 'none') {
    wx.showToast({ title, icon, duration: 2000 });
  },

  showModal(content, title = '提示') {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        success: (res) => resolve(res.confirm)
      });
    });
  },

  formatDate(date, format = 'YYYY-MM-DD HH:mm') {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute);
  },

  formatMoney(amount) {
    return (amount / 100).toFixed(2);
  },

  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
};

module.exports = {
  request,
  api,
  wxApi,
  util
};
