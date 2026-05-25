const api = require('./utils/api.js');
const config = require('./utils/config.js');

App({
  globalData: {
    userInfo: null,
    token: null,
    location: null,
    city: null
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
    this.getLocation();
    this.checkUpdate();
  },

  onShow() {},

  checkLogin() {
    if (!this.globalData.token) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return false;
    }
    return true;
  },

  getLocation() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation'] === false) {
          wx.showModal({
            title: '提示',
            content: '需要获取您的位置以推荐附近的师傅',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.getLocation({
            type: 'gcj02',
            success: (res) => {
              this.globalData.location = {
                latitude: res.latitude,
                longitude: res.longitude
              };
              this.getCity(res.latitude, res.longitude);
            },
            fail: () => {
              console.log('获取位置失败');
            }
          });
        }
      }
    });
  },

  getCity(latitude, longitude) {
    wx.request({
      url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=${config.qqMapKey}`,
      success: (res) => {
        if (res.data && res.data.result) {
          this.globalData.city = res.data.result.address_component.city;
        }
      }
    });
  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  setToken(token) {
    this.globalData.token = token;
    wx.setStorageSync('token', token);
  },

  logout() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
          updateManager.onUpdateFailed(() => {
            wx.showToast({
              title: '新版本下载失败',
              icon: 'none'
            });
          });
        }
      });
    }
  },

  api: api,
  config: config
});
