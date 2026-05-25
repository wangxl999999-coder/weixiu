const app = getApp();
const config = require('./config.js');

const request = (options) => {
  return new Promise((resolve, reject) => {
    const app = getApp();
    wx.request({
      url: config.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data);
          } else if (res.data.code === 401) {
            app.logout();
            wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/login/login' });
            }, 1500);
            reject(res.data);
          } else {
            wx.showToast({ title: res.data.message || '请求失败', icon: 'none' });
            reject(res.data);
          }
        } else {
          wx.showToast({ title: '网络请求失败', icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络连接失败', icon: 'none' });
        reject(err);
      }
    });
  });
};

const get = (url, data) => request({ url, method: 'GET', data });
const post = (url, data) => request({ url, method: 'POST', data });
const put = (url, data) => request({ url, method: 'PUT', data });
const del = (url, data) => request({ url, method: 'DELETE', data });

const api = {
  login: {
    wxLogin: (code) => post('/api/user/auth/wx-login', { code }),
    loginByPhone: (phone, code) => post('/api/user/auth/login-by-phone', { phone, code }),
    updatePhone: (code) => put('/api/user/phone', { code }),
    getUserInfo: () => get('/api/user/info'),
    updateUserInfo: (data) => put('/api/user/info', data)
  },

  home: {
    getHomeData: () => get('/api/home/data'),
    getCategories: () => get('/api/categories'),
    getServices: (data) => get('/api/services', data),
    searchServices: (keyword) => get('/api/services/search', { keyword }),
    getServiceDetail: (id) => get(`/api/services/${id}`),
    getFlashSales: () => get('/api/flash-sales'),
    getNearbyWorkers: (data) => get('/api/nearby-workers', data),
    getCouponBanners: () => get('/api/coupon-banners')
  },

  order: {
    create: (data) => post('/api/orders', data),
    getMyOrders: (data) => get('/api/orders', data),
    getDetail: (id) => get(`/api/orders/${id}`),
    cancel: (id, reason) => post(`/api/orders/${id}/cancel`, { reason }),
    confirm: (id) => post(`/api/orders/${id}/confirm`),
    applyRefund: (id, reason) => post(`/api/orders/${id}/refund`, { reason }),
    getAvailableWorkers: (id) => get(`/api/orders/${id}/available-workers`),
    getExtras: (orderId) => get('/api/order-extras', { order_id: orderId }),
    confirmExtra: (extraId, confirm) => post('/api/order-extras/confirm', { extra_id: extraId, confirm }),
    getPhotos: (orderId) => get('/api/order-photos', { order_id: orderId })
  },

  payment: {
    create: (data) => post('/api/payment/create', data),
    extraPay: (data) => post('/api/payment/extra', data)
  },

  coupon: {
    getList: (data) => get('/api/coupons', data),
    receive: (id) => post(`/api/coupons/${id}/receive`),
    getUserCoupons: (data) => get('/api/user-coupons', data),
    getAvailableCoupons: (orderId) => get('/api/order-available-coupons', { order_id: orderId })
  },

  address: {
    getList: () => get('/api/addresses'),
    create: (data) => post('/api/addresses', data),
    update: (id, data) => put(`/api/addresses/${id}`, data),
    delete: (id) => del(`/api/addresses/${id}`),
    setDefault: (id) => post(`/api/addresses/${id}/default`)
  },

  evaluation: {
    create: (data) => post('/api/evaluations', data),
    getList: (data) => get('/api/evaluations', data),
    getMyEvaluations: (data) => get('/api/my-evaluations', data)
  },

  complaint: {
    getTypes: () => get('/api/complaint-types'),
    create: (data) => post('/api/complaints', data),
    getMyList: (data) => get('/api/my-complaints', data),
    getDetail: (id) => get(`/api/complaints/${id}`)
  },

  wxLogin: () => {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (res.code) {
            try {
              const result = await api.login.wxLogin(res.code);
              if (result.data && result.data.token) {
                app.setToken(result.data.token);
                if (result.data.user) {
                  app.setUserInfo(result.data.user);
                }
                resolve(result.data);
              } else {
                reject(new Error('登录失败'));
              }
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error('微信登录失败'));
          }
        },
        fail: reject
      });
    });
  },

  wxPay: (params) => {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: params.timeStamp,
        nonceStr: params.nonceStr,
        package: params.package,
        signType: params.signType || 'RSA',
        paySign: params.paySign,
        success: resolve,
        fail: reject
      });
    });
  },

  uploadFile: (filePath) => {
    return new Promise((resolve, reject) => {
      const app = getApp();
      wx.uploadFile({
        url: config.baseUrl + '/api/upload',
        filePath,
        name: 'file',
        header: {
          'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              resolve(data.data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch {
            reject(new Error('解析失败'));
          }
        },
        fail: reject
      });
    });
  },

  chooseLocation: () => {
    return new Promise((resolve, reject) => {
      wx.chooseLocation({
        success: resolve,
        fail: reject
      });
    });
  },

  chooseImage: (count = 1) => {
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: (res) => {
          resolve(res.tempFiles.map(f => f.tempFilePath));
        },
        fail: reject
      });
    });
  },

  previewImage: (urls, current) => {
    wx.previewImage({
      urls,
      current
    });
  },

  makePhoneCall: (phone) => {
    wx.makePhoneCall({ phoneNumber: phone });
  },

  navigateToLocation: (latitude, longitude, name) => {
    wx.openLocation({
      latitude,
      longitude,
      name,
      scale: 18
    });
  }
};

module.exports = api;
