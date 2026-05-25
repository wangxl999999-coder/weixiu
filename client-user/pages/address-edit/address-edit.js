const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    id: '',
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    is_default: false,
    latitude: null,
    longitude: null,
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadAddressDetail();
    }
  },

  async loadAddressDetail() {
    try {
      const res = await api.address.getList();
      const addresses = res.data.list || res.data || [];
      const address = addresses.find(a => a.id == this.data.id);
      if (address) {
        this.setData({
          name: address.name,
          phone: address.phone,
          province: address.province,
          city: address.city,
          district: address.district,
          detail: address.detail,
          is_default: address.is_default,
          latitude: address.latitude,
          longitude: address.longitude
        });
      }
    } catch (err) {
      console.error('加载地址详情失败:', err);
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onDetailInput(e) {
    this.setData({ detail: e.detail.value });
  },

  onDefaultChange(e) {
    this.setData({ is_default: e.detail.value });
  },

  async chooseLocation() {
    try {
      const res = await api.chooseLocation();
      this.setData({
        province: res.name ? '' : '请选择',
        city: '',
        district: '',
        detail: res.name || res.address || '',
        latitude: res.latitude,
        longitude: res.longitude
      });
    } catch (err) {
      if (err.errMsg !== 'chooseLocation:fail cancel') {
        util.showToast('获取位置失败');
      }
    }
  },

  async submit() {
    if (!this.data.name) {
      util.showToast('请输入联系人姓名');
      return;
    }
    if (!this.data.phone || this.data.phone.length !== 11) {
      util.showToast('请输入正确的手机号');
      return;
    }
    if (!this.data.detail) {
      util.showToast('请输入详细地址');
      return;
    }

    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      const data = {
        name: this.data.name,
        phone: this.data.phone,
        province: this.data.province || '北京市',
        city: this.data.city || '北京市',
        district: this.data.district || '东城区',
        detail: this.data.detail,
        is_default: this.data.is_default ? 1 : 0,
        latitude: this.data.latitude,
        longitude: this.data.longitude
      };

      if (this.data.id) {
        await api.address.update(this.data.id, data);
      } else {
        await api.address.create(data);
      }

      util.showToast('保存成功', 'success');
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('保存地址失败:', err);
      util.showToast('保存失败');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
