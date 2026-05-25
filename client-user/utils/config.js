const BASE_URL = 'https://api.example.com';

const config = {
  baseUrl: BASE_URL,
  qqMapKey: 'YOUR_QQ_MAP_KEY',
  defaultAvatar: '/images/default-avatar.png',
  orderStatusMap: {
    0: { text: '待接单', color: '#faad14' },
    1: { text: '已接单', color: '#1890ff' },
    2: { text: '服务中', color: '#13c2c2' },
    3: { text: '待确认', color: '#722ed1' },
    4: { text: '已完成', color: '#52c41a' },
    5: { text: '已取消', color: '#f5222d' },
    6: { text: '已退款', color: '#8c8c8c' }
  },
  payStatusMap: {
    0: { text: '未支付', color: '#f5222d' },
    1: { text: '已支付', color: '#52c41a' },
    2: { text: '已退款', color: '#8c8c8c' }
  },
  complaintStatusMap: {
    0: { text: '待处理', color: '#faad14' },
    1: { text: '处理中', color: '#1890ff' },
    2: { text: '已完成', color: '#52c41a' },
    3: { text: '已驳回', color: '#f5222d' }
  }
};

module.exports = config;
