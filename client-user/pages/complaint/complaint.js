const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    orderId: '',
    type: 1,
    typeList: [
      { key: 1, name: '服务质量' },
      { key: 2, name: '师傅态度' },
      { key: 3, name: '收费问题' },
      { key: 4, name: '其他' }
    ],
    content: '',
    images: [],
    contact: '',
    submitting: false
  },

  onLoad(options) {
    if (options.order_id) {
      this.setData({ orderId: options.order_id });
    }
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ type });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  async chooseImage() {
    const remain = 5 - this.data.images.length;
    if (remain <= 0) {
      util.showToast('最多上传5张图片');
      return;
    }

    try {
      const files = await api.chooseImage(remain);
      this.setData({
        images: [...this.data.images, ...files]
      });
    } catch (err) {
      console.error('选择图片失败:', err);
    }
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  async submit() {
    if (!this.data.content.trim()) {
      util.showToast('请输入投诉内容');
      return;
    }

    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      const uploadedImages = [];
      for (const img of this.data.images) {
        const res = await api.uploadFile(img);
        uploadedImages.push(res.url);
      }

      await api.complaint.create({
        order_id: this.data.orderId || 0,
        type: this.data.type,
        content: this.data.content,
        images: uploadedImages.join(','),
        contact: this.data.contact
      });

      util.showToast('提交成功', 'success');
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('提交投诉失败:', err);
      util.showToast('提交失败');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
