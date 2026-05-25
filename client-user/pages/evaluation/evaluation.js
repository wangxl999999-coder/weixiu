const api = require('../../utils/api.js');
const util = require('../../utils/util.js');

Page({
  data: {
    orderId: '',
    order: null,
    rating: 5,
    content: '',
    images: [],
    submitting: false,
    anonymous: false
  },

  onLoad(options) {
    if (options.order_id) {
      this.setData({ orderId: options.order_id });
      this.loadOrderDetail();
    }
  },

  async loadOrderDetail() {
    try {
      const res = await api.order.getDetail(this.data.orderId);
      this.setData({ order: res.data });
    } catch (err) {
      console.error('加载订单详情失败:', err);
    }
  },

  selectRating(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
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

  onAnonymousChange(e) {
    this.setData({ anonymous: e.detail.value });
  },

  async submit() {
    if (!this.data.content.trim()) {
      util.showToast('请输入评价内容');
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

      await api.evaluation.create({
        order_id: this.data.orderId,
        rating: this.data.rating,
        content: this.data.content,
        images: uploadedImages.join(','),
        is_anonymous: this.data.anonymous ? 1 : 0
      });

      util.showToast('评价成功', 'success');
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('提交评价失败:', err);
      util.showToast('评价失败');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
