const { api, wxApi, util } = require('../../utils/api.js');

Page({
  data: {
    phone: '',
    name: '',
    idCard: '',
    idCardFront: '',
    idCardBack: '',
    certificates: [],
    skills: [],
    skillOptions: ['家电维修', '空调维修', '洗衣机维修', '冰箱维修', '热水器维修', '水电维修', '保洁清洗', '管道疏通', '家具维修'],
    experience: '',
    intro: '',
    submitting: false,
    step: 1
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (token) {
      getApp().globalData.token = token;
      this.checkRegistration();
    }
  },

  async checkRegistration() {
    try {
      const res = await api.worker.getInfo();
      if (res.data) {
        wx.switchTab({ url: '/pages/index/index' });
      }
    } catch (err) {
      getApp().logout();
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onIdCardInput(e) {
    this.setData({ idCard: e.detail.value });
  },

  onExperienceInput(e) {
    this.setData({ experience: e.detail.value });
  },

  onIntroInput(e) {
    this.setData({ intro: e.detail.value });
  },

  async getPhoneNumber(e) {
    if (!e.detail.code) return;
    
    try {
      util.showLoading('登录中...');
      const loginRes = await wxApi.wxLogin();
      const res = await api.worker.login(loginRes.code, e.detail.code);
      util.hideLoading();
      
      if (res.data && res.data.token) {
        getApp().setToken(res.data.token);
        if (res.data.user) {
          getApp().setUserInfo(res.data.user);
          if (res.data.user.status === 1) {
            wx.switchTab({ url: '/pages/index/index' });
            return;
          }
        }
        this.setData({ step: 2 });
      }
    } catch (err) {
      util.hideLoading();
      util.showToast(err.message || '登录失败');
    }
  },

  nextStep() {
    if (!this.data.phone) {
      util.showToast('请输入手机号');
      return;
    }
    if (!this.data.name) {
      util.showToast('请输入姓名');
      return;
    }
    if (!this.data.idCard || this.data.idCard.length !== 18) {
      util.showToast('请输入正确的身份证号');
      return;
    }
    this.setData({ step: 2 });
  },

  prevStep() {
    this.setData({ step: 1 });
  },

  async uploadIdCard(e) {
    const type = e.currentTarget.dataset.type;
    try {
      const files = await wxApi.chooseImage(1);
      util.showLoading('上传中...');
      const res = await wxApi.uploadFile(files[0]);
      util.hideLoading();
      
      if (type === 'front') {
        this.setData({ idCardFront: res.url });
      } else {
        this.setData({ idCardBack: res.url });
      }
    } catch (err) {
      util.hideLoading();
      util.showToast('上传失败');
    }
  },

  async uploadCertificate() {
    if (this.data.certificates.length >= 3) {
      util.showToast('最多上传3张证书');
      return;
    }
    
    try {
      const files = await wxApi.chooseImage(1);
      util.showLoading('上传中...');
      const res = await wxApi.uploadFile(files[0]);
      util.hideLoading();
      
      this.setData({
        certificates: [...this.data.certificates, res.url]
      });
    } catch (err) {
      util.hideLoading();
      util.showToast('上传失败');
    }
  },

  removeCertificate(e) {
    const index = e.currentTarget.dataset.index;
    const certificates = [...this.data.certificates];
    certificates.splice(index, 1);
    this.setData({ certificates });
  },

  toggleSkill(e) {
    const skill = e.currentTarget.dataset.skill;
    const skills = [...this.data.skills];
    const index = skills.indexOf(skill);
    
    if (index > -1) {
      skills.splice(index, 1);
    } else {
      skills.push(skill);
    }
    
    this.setData({ skills });
  },

  async submit() {
    if (!this.data.idCardFront) {
      util.showToast('请上传身份证正面');
      return;
    }
    if (!this.data.idCardBack) {
      util.showToast('请上传身份证反面');
      return;
    }
    if (this.data.skills.length === 0) {
      util.showToast('请选择擅长技能');
      return;
    }
    if (!this.data.experience) {
      util.showToast('请输入从业年限');
      return;
    }

    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      util.showLoading('提交中...');
      await api.worker.register({
        phone: this.data.phone,
        name: this.data.name,
        id_card: this.data.idCard,
        id_card_front: this.data.idCardFront,
        id_card_back: this.data.idCardBack,
        certificates: this.data.certificates.join(','),
        skills: this.data.skills.join(','),
        experience: this.data.experience,
        intro: this.data.intro
      });
      util.hideLoading();
      
      wx.showModal({
        title: '提交成功',
        content: '您的资料已提交，请等待平台审核',
        showCancel: false,
        success: () => {
          wx.switchTab({ url: '/pages/index/index' });
        }
      });
    } catch (err) {
      util.hideLoading();
      util.showToast(err.message || '提交失败');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
