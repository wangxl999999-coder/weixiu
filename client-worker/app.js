App({
  globalData: {
    token: '',
    userInfo: null,
    baseUrl: 'https://api.example.com/api',
    location: null
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
    }
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }

    this.checkLogin();
    this.getLocation();
  },

  checkLogin() {
    if (!this.globalData.token) {
      const pages = getCurrentPages();
      const currentPage = pages.length > 0 ? pages[pages.length - 1].route : '';
      if (currentPage !== 'pages/registration/registration' && currentPage !== 'pages/index/index') {
        wx.navigateTo({
          url: '/pages/registration/registration',
          fail: () => {
            wx.redirectTo({ url: '/pages/registration/registration' });
          }
        });
      }
    }
  },

  async getLocation() {
    try {
      const res = await wx.getLocation({ type: 'gcj02' });
      this.globalData.location = {
        latitude: res.latitude,
        longitude: res.longitude
      };
    } catch (err) {
      console.error('获取位置失败:', err);
    }
  },

  setToken(token) {
    this.globalData.token = token;
    wx.setStorageSync('token', token);
  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  logout() {
    this.globalData.token = '';
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  }
});
