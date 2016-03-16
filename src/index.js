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
    this.uuid = uuid;
    return uuid;

  }

  async getLoginQRCode() {

    const url = config.api.qrcode + this.uuid;
    this._debug('getLoginQRCode: generate QRCode, text=%s', url);
    const qrcode = await utils.generateQRCode(url);

    return qrcode;

  }

  async checkLoginStatus() {

    this._debug('checkLoginStatus: query');
    const {response, body} = await utils.sendRequest({
      method: 'GET',
      url: config.api.loginStatus + '?uuid=' + this.uuid + '&_=' + utils.getTimestamp(),
    });

    const lines = body.split(/\n/);
    const s1 = lines[0].match(/window.code=(\d+)/);
    if (s1) {
      const code = Number(s1[1]);
      this._debug('checkLoginStatus: code=%s', code);
      if (code === 200) {
        const s2 = lines[1].match(/window.redirect_uri="(.+)"/);
        if (s2) {
          const url = s2[1];
          return {code, url};
        } else {
          return {code, url: false};
        }
      } else {
        return {code};
      }
    } else {
      return {code: false};
    }

  }

  async login() {

    this._debug('login: getLoginQRCode');
    await this.getUuid();
    const qrcode = await this.getLoginQRCode();
    console.log(qrcode);

    while (true) {
      await utils.sleep(100);
      const {code, url} = await this.checkLoginStatus();
      this._debug('login: status, code=%s, url=%s', code, url);
      if (code === 200) {
        break;
      } else if (code === 201) {
        this._debug('login: waiting user confirm login');
      } else if (code === 408) {
        this._debug('login: timeout');
      } else {
        throw new Error(`login failed waith status code ${code}`);
      }
    }

  }

}
