const success = (res, data = null, message = 'success', code = 200) => {
  res.status(code).json({
    code,
    message,
    data,
    timestamp: Date.now()
  });
};

const error = (res, message = 'error', code = 400, errors = null) => {
  res.status(code).json({
    code,
    message,
    errors,
    timestamp: Date.now()
  });
};

const paginate = (res, data, total, page = 1, pageSize = 10, message = 'success') => {
  res.status(200).json({
    code: 200,
    message,
    data: {
      list: data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    },
    timestamp: Date.now()
  });
};

module.exports = {
  success,
  error,
  paginate
};
