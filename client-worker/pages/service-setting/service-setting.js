const { api, util } = require('../../utils/api.js');

Page({
  data: {
    serviceArea: '',
    city: '',
    district: '',
    detail: '',
    serviceRadius: 5,
    radiusOptions: [3, 5, 10, 15, 20],
    workDays: [],
    dayOptions: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    workStartTime: '08:00',
    workEndTime: '18:00',
    serviceTypes: [],
    typeOptions: ['家电维修', '空调维修', '洗衣机维修', '水电维修', '保洁清洗', '管道疏通', '家具维修'],
    submitting: false,
    latitude: null,
    longitude: null
  },

  onLoad() {
    this.loadServiceSetting();
  },

  async loadServiceSetting() {
    try {
      const res = await api.worker.getInfo();
      const info = res.data;
      
      if (info) {
        this.setData({
          serviceArea: info.service_area || '',
          serviceRadius: info.service_radius || 5,
          workDays: info.work_days ? info.work_days.split(',') : [],
          workStartTime: info.work_start_time || '08:00',
          workEndTime: info.work_end_time || '18:00',
          serviceTypes: info.skills ? info.skills.split(',') : [],
          latitude: info.latitude,
          longitude: info.longitude
        });
      }
    } catch (err) {
      console.error('加载服务设置失败:', err);
    }
  },

  async chooseLocation() {
    try {
      const res = await wx.chooseLocation();
      this.setData({
        serviceArea: res.address + ' ' + res.name,
        city: res.name || '',
        detail: res.address || '',
        latitude: res.latitude,
        longitude: res.longitude
      });
    } catch (err) {
      if (err.errMsg !== 'chooseLocation:fail cancel') {
        util.showToast('获取位置失败');
      }
    }
  },

  selectRadius(e) {
    const radius = e.currentTarget.dataset.radius;
    this.setData({ serviceRadius: radius });
  },

  toggleDay(e) {
    const day = e.currentTarget.dataset.day;
    const workDays = [...this.data.workDays];
    const index = workDays.indexOf(day);
    
    if (index > -1) {
      workDays.splice(index, 1);
    } else {
      workDays.push(day);
    }
    
    this.setData({ workDays });
  },

  toggleType(e) {
    const type = e.currentTarget.dataset.type;
    const serviceTypes = [...this.data.serviceTypes];
    const index = serviceTypes.indexOf(type);
    
    if (index > -1) {
      serviceTypes.splice(index, 1);
    } else {
      serviceTypes.push(type);
    }
    
    this.setData({ serviceTypes });
  },

  onStartTimeChange(e) {
    this.setData({ workStartTime: e.detail.value });
  },

  onEndTimeChange(e) {
    this.setData({ workEndTime: e.detail.value });
  },

  async submit() {
    if (!this.data.serviceArea) {
      util.showToast('请设置服务区域');
      return;
    }
    if (this.data.workDays.length === 0) {
      util.showToast('请选择工作日');
      return;
    }
    if (this.data.serviceTypes.length === 0) {
      util.showToast('请选择服务类型');
      return;
    }

    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      util.showLoading('保存中...');
      await api.worker.updateServiceSetting({
        service_area: this.data.serviceArea,
        service_radius: this.data.serviceRadius,
        work_days: this.data.workDays.join(','),
        work_start_time: this.data.workStartTime,
        work_end_time: this.data.workEndTime,
        skills: this.data.serviceTypes.join(','),
        latitude: this.data.latitude,
        longitude: this.data.longitude
      });
      util.hideLoading();
      util.showToast('保存成功', 'success');
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      util.hideLoading();
      util.showToast(err.message || '保存失败');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
