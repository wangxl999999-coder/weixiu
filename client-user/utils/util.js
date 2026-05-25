const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
};

const formatMoney = (num) => {
  if (!num && num !== 0) return '0.00';
  return parseFloat(num).toFixed(2);
};

const getTimeText = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
  return formatDate(date);
};

const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}${month}${day}${random}${Date.now().toString().slice(-4)}`;
};

const distanceText = (distance) => {
  if (!distance) return '';
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
};

const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

const maskIdCard = (idCard) => {
  if (!idCard) return '';
  return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2');
};

const debounce = (fn, delay = 300) => {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

const throttle = (fn, delay = 300) => {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime > delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
};

const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({ title, icon, duration });
};

const showLoading = (title = '加载中') => {
  wx.showLoading({ title, mask: true });
};

const hideLoading = () => {
  wx.hideLoading();
};

const showModal = (content, options = {}) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: options.title || '提示',
      content,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      confirmColor: options.confirmColor || '#1890ff',
      success: (res) => resolve(res.confirm)
    });
  });
};

module.exports = {
  formatTime,
  formatDate,
  formatMoney,
  getTimeText,
  generateOrderNo,
  distanceText,
  maskPhone,
  maskIdCard,
  debounce,
  throttle,
  showToast,
  showLoading,
  hideLoading,
  showModal
};
