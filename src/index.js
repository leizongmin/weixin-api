'use strict';

/**
 * wxapi
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import config from './config';
import * as utils from './utils';

let instanceCounter = 0;

export default class WeixinAPI {

  constructor(options) {

    this._options = options = options || {};

    this._debug = utils.createDebug('wxapi:#' + (instanceCounter++));
    this._debug('created');

  }

  async getUuid() {

    this._debug('getUuid: send request');
    const {response, body} = await utils.sendRequest({
      method: 'POST',
      url: config.api.jsLogin,
      form: {
        appId: config.appId,
        fun: config.fun,
        lang: config.lang,
        _: utils.getTimestamp(),
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
    const qrcode = await utils.generateQRCode(url);

    return qrcode;

  }

}
