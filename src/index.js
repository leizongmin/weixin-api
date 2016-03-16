'use strict';

/**
 * wxapi
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import request from 'request';
import QRCodeTerminal from 'qrcode-terminal';
import config from './config';
import createDebug from 'debug';
const debug = createDebug('wxapi:utils');

let instanceCounter = 0;

function getTimestamp() {
  return new Date().getTime();
}

function sendRequest(options) {
  debug('sendRequest: %s %s', options.method, options.url);
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) return reject(err);
      resolve({response, body});
    });
  });
}

function generateQRCode(text) {
  debug('generateQRCode: %s', text);
  return new Promise((resolve, reject) => {
    QRCodeTerminal.generate(text, ret => {
      resolve(ret);
    });
  });
}

export default class WeixinAPI {

  constructor(options) {

    this._options = options = options || {};

    this._debug = createDebug('wxapi:#' + (instanceCounter++));
    this._debug('created');

  }

  async getUuid() {

    this._debug('getUuid: send request');
    const {response, body} = await sendRequest({
      method: 'POST',
      url: config.api.jsLogin,
      form: {
        appId: config.appId,
        fun: config.fun,
        lang: config.lang,
        _: getTimestamp(),
      }
    });

    const s = body.match(/window.QRLogin.code = 200; window.QRLogin.uuid = "(.+)"/);
    const uuid = s && s[1];
    if (!uuid) {
      this._debug('getUuid: failed, response=%s', body);
      return false;
    }

    this._debug('getUuid: uuid=%s', uuid);
    return uuid;

  }

  async getLoginQRCode() {

    this._debug('getLoginQRCode: get uuid');
    const uuid = await this.getUuid();
    if (!uuid) {
      this._debug('getLoginQRCode: get uuid failed');
      return false;
    }

    const url = config.api.qrcode + uuid;
    this._debug('getLoginQRCode: generate QRCode, text=%s', url);
    const qrcode = await generateQRCode(url);

    return qrcode;

  }

}
