const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const xml2js = require('xml2js');
const config = require('../config');
const { generatePaymentNo } = require('../utils');
const logger = require('../utils/logger');

class WechatPayService {
  constructor() {
    this.mchId = config.wechat.pay.mchid;
    this.key = config.wechat.pay.key;
    this.appid = config.wechat.user.appid;
    this.notifyUrl = config.wechat.pay.notifyUrl;
    this.certPath = config.wechat.pay.certPath;
    this.keyPath = config.wechat.pay.keyPath;
  }

  generateSign(params) {
    const sortedParams = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== '' && key !== 'sign')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const signStr = `${sortedParams}&key=${this.key}`;
    return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  }

  verifySign(params) {
    const sign = params.sign;
    const generatedSign = this.generateSign(params);
    return sign === generatedSign;
  }

  async createUnifiedOrder(order) {
    const params = {
      appid: this.appid,
      mch_id: this.mchId,
      nonce_str: crypto.randomBytes(16).toString('hex'),
      body: order.service_name,
      out_trade_no: generatePaymentNo(),
      total_fee: Math.round(order.pay_price * 100),
      spbill_create_ip: '127.0.0.1',
      notify_url: this.notifyUrl,
      trade_type: 'JSAPI',
      openid: order.user_openid
    };

    params.sign = this.generateSign(params);

    const xmlBuilder = new xml2js.Builder();
    const xml = xmlBuilder.buildObject(params);

    try {
      const response = await axios.post(
        'https://api.mch.weixin.qq.com/pay/unifiedorder',
        xml,
        { headers: { 'Content-Type': 'application/xml' } }
      );

      const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });

      if (result.xml.return_code !== 'SUCCESS' || result.xml.result_code !== 'SUCCESS') {
        throw new Error(result.xml.err_code_des || '统一下单失败');
      }

      const prepayId = result.xml.prepay_id;

      const payParams = {
        appId: this.appid,
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        nonceStr: crypto.randomBytes(16).toString('hex'),
        package: `prepay_id=${prepayId}`,
        signType: 'MD5'
      };

      payParams.paySign = this.generateSign(payParams);

      return {
        ...payParams,
        prepayId,
        paymentNo: params.out_trade_no
      };
    } catch (error) {
      logger.error('微信统一下单错误:', error);
      throw error;
    }
  }

  async parseNotify(xmlData) {
    try {
      const result = await xml2js.parseStringPromise(xmlData, { explicitArray: false });
      const data = result.xml;

      if (!this.verifySign(data)) {
        throw new Error('签名验证失败');
      }

      if (data.return_code !== 'SUCCESS') {
        throw new Error('支付通知失败');
      }

      return {
        outTradeNo: data.out_trade_no,
        transactionId: data.transaction_id,
        totalFee: parseInt(data.total_fee) / 100,
        timeEnd: data.time_end,
        openid: data.openid,
        tradeType: data.trade_type,
        resultCode: data.result_code
      };
    } catch (error) {
      logger.error('解析支付通知错误:', error);
      throw error;
    }
  }

  async refund(order, refundAmount, refundReason) {
    const params = {
      appid: this.appid,
      mch_id: this.mchId,
      nonce_str: crypto.randomBytes(16).toString('hex'),
      out_trade_no: order.order_no,
      out_refund_no: `REF${Date.now()}`,
      total_fee: Math.round(order.pay_price * 100),
      refund_fee: Math.round(refundAmount * 100),
      refund_desc: refundReason
    };

    params.sign = this.generateSign(params);

    const xmlBuilder = new xml2js.Builder();
    const xml = xmlBuilder.buildObject(params);

    try {
      const cert = fs.readFileSync(this.certPath);
      const key = fs.readFileSync(this.keyPath);

      const response = await axios.post(
        'https://api.mch.weixin.qq.com/secapi/pay/refund',
        xml,
        {
          headers: { 'Content-Type': 'application/xml' },
          httpsAgent: new (require('https').Agent)({ cert, key })
        }
      );

      const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });

      if (result.xml.return_code !== 'SUCCESS' || result.xml.result_code !== 'SUCCESS') {
        throw new Error(result.xml.err_code_des || '退款失败');
      }

      return {
        outRefundNo: params.out_refund_no,
        refundId: result.xml.refund_id
      };
    } catch (error) {
      logger.error('微信退款错误:', error);
      throw error;
    }
  }

  async transfer(worker, amount, withdrawNo) {
    const params = {
      mch_appid: config.wechat.worker.appid,
      mchid: this.mchId,
      nonce_str: crypto.randomBytes(16).toString('hex'),
      partner_trade_no: withdrawNo,
      openid: worker.openid,
      check_name: 'NO_CHECK',
      amount: Math.round(amount * 100),
      desc: '师傅提现',
      spbill_create_ip: '127.0.0.1'
    };

    params.sign = this.generateSign(params);

    const xmlBuilder = new xml2js.Builder();
    const xml = xmlBuilder.buildObject(params);

    try {
      const cert = fs.readFileSync(this.certPath);
      const key = fs.readFileSync(this.keyPath);

      const response = await axios.post(
        'https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers',
        xml,
        {
          headers: { 'Content-Type': 'application/xml' },
          httpsAgent: new (require('https').Agent)({ cert, key })
        }
      );

      const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });

      if (result.xml.return_code !== 'SUCCESS' || result.xml.result_code !== 'SUCCESS') {
        throw new Error(result.xml.err_code_des || '转账失败');
      }

      return {
        paymentNo: result.xml.payment_no,
        paymentTime: result.xml.payment_time
      };
    } catch (error) {
      logger.error('微信转账错误:', error);
      throw error;
    }
  }
}

module.exports = new WechatPayService();
