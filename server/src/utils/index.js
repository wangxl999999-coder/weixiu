const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const generateOrderNo = () => {
  const date = moment().format('YYYYMMDDHHmmss');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${date}${random}`;
};

const generatePaymentNo = () => {
  const date = moment().format('YYYYMMDDHHmmss');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PAY${date}${random}`;
};

const generateWithdrawNo = () => {
  const date = moment().format('YYYYMMDDHHmmss');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WIT${date}${random}`;
};

const generateRecordNo = () => {
  const date = moment().format('YYYYMMDDHHmmss');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REC${date}${random}`;
};

const md5 = (str) => {
  return crypto.createHash('md5').update(str).digest('hex');
};

const sha256 = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

const randomString = (length = 16) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

const generateUUID = () => {
  return uuidv4().replace(/-/g, '');
};

const calculateDistance = (lat1, lon1, lat2, lon2, unit = 'km') => {
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const a = radLat1 - radLat2;
  const b = (lon1 * Math.PI) / 180 - (lon2 * Math.PI) / 180;
  let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
  s = s * 6378.137;
  if (unit === 'm') {
    s = s * 1000;
  }
  return Math.round(s * 100) / 100;
};

const maskPhone = (phone) => {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

const maskIdCard = (idCard) => {
  if (!idCard || idCard.length < 15) return idCard;
  if (idCard.length === 15) {
    return idCard.replace(/(\d{6})\d{6}(\d{3})/, '$1******$2');
  }
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
};

const formatMoney = (amount) => {
  return Number(amount).toFixed(2);
};

const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

const isValidPhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

const isValidIdCard = (idCard) => {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
};

const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

const parseJson = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
};

module.exports = {
  generateOrderNo,
  generatePaymentNo,
  generateWithdrawNo,
  generateRecordNo,
  md5,
  sha256,
  randomString,
  generateUUID,
  calculateDistance,
  maskPhone,
  maskIdCard,
  formatMoney,
  getFileExtension,
  isValidPhone,
  isValidIdCard,
  formatDate,
  parseJson
};
