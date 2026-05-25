const config = {
  baseUrl: 'https://api.example.com/api',
  mapKey: '',
  
  workerStatusMap: {
    0: '待审核',
    1: '已通过',
    2: '已拒绝',
    3: '已禁用'
  },
  
  orderStatusMap: {
    0: '待接单',
    1: '待服务',
    2: '服务中',
    3: '待确认',
    4: '已完成',
    5: '已取消',
    6: '退款中',
    7: '已退款'
  },
  
  orderStatusColorMap: {
    0: '#faad14',
    1: '#1890ff',
    2: '#52c41a',
    3: '#faad14',
    4: '#52c41a',
    5: '#999',
    6: '#ff4d4f',
    7: '#999'
  }
};

module.exports = config;
