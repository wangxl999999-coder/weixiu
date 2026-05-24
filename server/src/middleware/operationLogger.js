const db = require('../models');

const operationLogger = async (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    try {
      const responseTime = Date.now() - start;
      const method = req.method;
      const path = req.path;
      const statusCode = res.statusCode;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      let responseData = null;
      try {
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            responseData = parsed;
          } catch {
            responseData = { message: data.substring(0, 500) };
          }
        } else if (typeof data === 'object') {
          responseData = data;
        }
      } catch {
        responseData = null;
      }

      if (path.includes('/api/') && !path.includes('/uploads/') && !path.includes('/wechat/notify')) {
        const requestParams = {
          query: req.query,
          body: req.body ? { ...req.body } : null
        };

        if (requestParams.body?.password) delete requestParams.body.password;
        if (requestParams.body?.old_password) delete requestParams.body.old_password;
        if (requestParams.body?.new_password) delete requestParams.body.new_password;
        if (requestParams.body?.code) delete requestParams.body.code;

        if (statusCode !== 404 && method !== 'GET') {
          let userType = null;
          let userId = null;
          let username = null;

          if (req.currentUser) {
            userType = 1;
            userId = req.currentUser.id;
            username = req.currentUser.nickname || req.currentUser.phone;
          } else if (req.currentWorker) {
            userType = 2;
            userId = req.currentWorker.id;
            username = req.currentWorker.name || req.currentWorker.phone;
          } else if (req.currentAdmin) {
            userType = 3;
            userId = req.currentAdmin.id;
            username = req.currentAdmin.name || req.currentAdmin.username;
          }

          if (userId && userType) {
            const moduleMap = {
              'auth': '认证',
              'user': '用户',
              'worker': '师傅',
              'order': '订单',
              'payment': '支付',
              'coupon': '优惠券',
              'address': '地址',
              'evaluation': '评价',
              'complaint': '投诉',
              'wallet': '钱包',
              'withdraw': '提现',
              'service': '服务',
              'category': '分类',
              'finance': '财务',
              'marketing': '营销',
              'statistics': '统计',
              'admin': '管理员'
            };

            const actionMap = {
              'POST': '创建',
              'PUT': '更新',
              'DELETE': '删除'
            };

            const pathParts = path.split('/');
            let module = '其他';
            for (const key of Object.keys(moduleMap)) {
              if (path.includes(key)) {
                module = moduleMap[key];
                break;
              }
            }

            const action = actionMap[method] || '操作';
            const success = statusCode >= 200 && statusCode < 400;

            db.OperationLog.create({
              user_type: userType,
              user_id: userId,
              username,
              module,
              action,
              method,
              path,
              ip,
              user_agent: userAgent,
              request_params: JSON.stringify(requestParams),
              response_code: statusCode,
              response_data: responseData ? JSON.stringify(responseData).substring(0, 2000) : null,
              response_time: responseTime,
              success
            }).catch(err => {
              console.error('记录操作日志失败:', err.message);
            });
          }
        }
      }
    } catch (err) {
      console.error('操作日志中间件错误:', err.message);
    }

    return originalSend.call(this, data);
  };

  next();
};

module.exports = operationLogger;
