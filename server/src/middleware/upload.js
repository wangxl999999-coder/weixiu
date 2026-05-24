const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { generateUUID, getFileExtension } = require('../utils');
const { error } = require('../utils/response');

const uploadDir = config.upload.path;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

['images', 'certificates', 'orders', 'avatars'].forEach(dir => {
  const fullPath = path.join(uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let subDir = 'images';
    if (file.fieldname.includes('certificate')) {
      subDir = 'certificates';
    } else if (file.fieldname.includes('order') || file.fieldname.includes('photo')) {
      subDir = 'orders';
    } else if (file.fieldname.includes('avatar')) {
      subDir = 'avatars';
    }
    cb(null, path.join(uploadDir, subDir));
  },
  filename: function(req, file, cb) {
    const ext = getFileExtension(file.originalname);
    const filename = `${generateUUID()}.${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持JPG、PNG、GIF格式'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxSize
  }
});

const uploadMiddleware = (fieldName, maxCount = 1) => {
  return (req, res, next) => {
    const uploadFn = maxCount > 1 ? upload.array(fieldName, maxCount) : upload.single(fieldName);
    uploadFn(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, `文件大小不能超过${config.upload.maxSize / 1024 / 1024}MB`, 400);
        }
        return error(res, err.message, 400);
      } else if (err) {
        return error(res, err.message, 400);
      }
      next();
    });
  };
};

const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const relativePath = filePath.replace(/\\/g, '/').replace(uploadDir.replace(/\\/g, '/'), '');
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads${relativePath}`;
};

module.exports = {
  upload,
  uploadMiddleware,
  getFileUrl
};
