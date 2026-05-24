const db = require('../models');

const operationLog = (module, action) => {
  return async (req, res, next) => {
    const oldSend = res.send;
    res.send = function(data) {
      try {
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        if (req.currentAdmin && result.code === 200) {
          db.OperationLog.create({
            admin_id: req.currentAdmin.id,
            admin_name: req.currentAdmin.name,
            module,
            action,
            target_id: req.params.id || req.body.id,
            content: `${action}操作成功`,
            ip: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          }).catch(err => {
            console.error('记录操作日志失败:', err);
          });
        }
      } catch (e) {
        console.error('处理操作日志失败:', e);
      }
      oldSend.call(res, data);
    };
    next();
  };
};

module.exports = {
  operationLog
};
