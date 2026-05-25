const { api, util } = require('../../utils/api.js');

Page({
  data: {
    balance: '0.00',
    amount: '',
    submitting: false,
    withdrawList: []
  },

  onLoad() {
    this.loadBalance();
    this.loadWithdrawList();
  },

  async loadBalance() {
    try {
      const res = await api.wallet.getInfo();
      this.setData({
        balance: util.formatMoney(res.data.balance || 0)
      });
    } catch (err) {
      console.error('加载余额失败:', err);
    }
  },

  async loadWithdrawList() {
    try {
      const res = await api.wallet.getWithdrawList(1, 10);
      this.setData({
        withdrawList: (res.data.list || res.data || []).map(item => ({
          ...item,
          amount: util.formatMoney(item.amount),
          created_at: util.formatDate(item.created_at)
        }))
      });
    } catch (err) {
      console.error('加载提现记录失败:', err);
    }
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  setMaxAmount() {
    this.setData({ amount: this.data.balance });
  },

  async submitWithdraw() {
    if (!this.data.amount) {
      util.showToast('请输入提现金额');
      return;
    }
    const amount = parseFloat(this.data.amount);
    if (amount <= 0) {
      util.showToast('提现金额必须大于0');
      return;
    }
    if (amount > parseFloat(this.data.balance)) {
      util.showToast('提现金额不能大于余额');
      return;
    }
    if (amount < 1) {
      util.showToast('最低提现1元');
      return;
    }

    if (this.data.submitting) return;
    this.setData({ submitting: true });

    try {
      util.showLoading('申请中...');
      await api.wallet.withdraw({ amount: amount * 100 });
      util.hideLoading();
      util.showToast('申请成功', 'success');
      this.setData({ amount: '' });
      this.loadBalance();
      this.loadWithdrawList();
    } catch (err) {
      util.hideLoading();
      util.showToast(err.message || '申请失败');
    } finally {
      this.setData({ submitting: false });
    }
  }
});
