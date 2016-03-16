'use strict';

/**
 * wxapi
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import {EventEmitter} from 'events';
import config from './config';
import * as utils from './utils';

let instanceCounter = 0;

export default class WeixinAPI extends EventEmitter {

  constructor(options) {
    super();

    this.options = options = options || {};
    this.session = {
      deviceId: utils.generateDeviceID(),
      cookies: {},
    };
    this.status = {};
    this.syncKey = null;
    this.syncKeyString = null;

    this.continueLoop = false;

    this._debug = utils.createDebug('#' + (instanceCounter++));
    this._debug('created');

  }

  async request(options) {

    options.headers = options.headers || {};
    options.headers.cookie = options.headers.cookie || '';

    const cookies = {};
    const now = new Date();
    for (const i in this.session.cookies) {
      const item = this.session.cookies[i];
      if (item.expires && item.expires < now) {
        this._debug('request: cookie expired, data=%j', item);
        delete this.session.cookies[i];
      } else {
        cookies[i] = item.value;
      }
    }
    options.headers.cookie = utils.serializeCookies(cookies) + (options.headers.cookie ? '; ' + options.headers.cookie : '');

    const {response, body} = await utils.sendRequest(options);
    if (response.headers['set-cookie']) {
      for (const item of response.headers['set-cookie']) {
        const r = utils.parseCookie(item);
        this.session.cookies[r.name] = r;
        this._debug('request: new cookie=%j', r);
      }
    }

    return {response, body};

  }

  getBaseRequest() {
    return {
      Uin: this.session.wxuin,
      Sid: this.session.wxsid,
      Skey: this.session.skey,
      DeviceID: this.session.deviceId,
    };
  }

  setSyncKey(key) {
    this.syncKey = key;
    this.syncKeyString = key.List.map((item) => item.Key + '_' + item.Val).join('|');
  }

  getSyncKey() {
    return this.syncKey;
  }

  getSyncKeyString() {
    return this.syncKeyString;
  }

  async getUuid() {

    this._debug('getUuid: send request');
    const {response, body} = await this.request({
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
    this.session.uuid = uuid;
    return uuid;

  }

  async getLoginQRCode() {

    const url = config.api.qrcode + this.session.uuid;
    this._debug('getLoginQRCode: generate QRCode, text=%s', url);
    const qrcode = await utils.generateQRCode(url);

    const image = config.api.qrcodeImage + this.session.uuid;

    return {qrcode, image};

  }

  async checkLoginStatus() {

    this._debug('checkLoginStatus: query');
    const {response, body} = await this.request({
      method: 'GET',
      url: config.api.loginStatus + `?uuid=${this.session.uuid}&_=${utils.getTimestamp()}`,
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

  async wxNewLoginPage(url) {

    this._debug('wxNewLoginPage: request');
    const {response, body} = await this.request({
      method: 'GET',
      url: url,
    });

    const data = utils.xmlToJSON(body);
    if (data && data.error && data.error.ret == 0) {

      this.session.skey = data.error.skey;
      this.session.wxsid = data.error.wxsid;
      this.session.wxuin = parseInt(data.error.wxuin, 10);
      this.session.pass_ticket = data.error.pass_ticket;

    } else {
      this.emit('error', new Error('call wxNewLoginPage failed'));
    }

  }

  async wxInit() {

    this._debug('wxInit: request');
    const {response, body} = await this.request({
      method: 'POST',
      url: config.api.init + `?pass_ticket=${this.session.pass_ticket}&skey=${this.session.skey}&r=${utils.getTimestamp()}`,
      headers: {
        'content-type': 'application/json; charset=UTF-8',
      },
      json: true,
      body: {
        BaseRequest: this.getBaseRequest(),
      },
    });

    if (body.BaseResponse.Ret != 0) {
      this.emit('error', new Error(`wxInit failed with code #${body.BaseResponse.Ret} ${body.BaseResponse.ErrMsg}`));
    }

    this._debug('wxInit: success');
    for (const i in body) {
      if (i !== 'BaseResponse' && i !== 'Count') {
        this.status[i] = body[i];
      }
    }
    if (body.SyncKey) {
      this.setSyncKey(body.SyncKey);
    }

  }

  async lookupSyncHost() {

    this.session.syncCheckUrl = null;

    for (const host of config.api.syncCheckHost) {
      try {
        const url = config.api.syncCheck.replace(/\$\{host\}/g, host);
        this._debug('lookupSyncHost: test %s', url);

        const {response, body} = await this.request({
          method: 'GET',
          url: url + `?sid=${this.session.wxsid}&skey=${this.session.skey}&uin=${this.session.wxuin}&deviceid=${this.session.deviceId}&synckey=${this.getSyncKeyString()}&r=${utils.getTimestamp()}&_=${utils.getTimestamp()}`,
        });
        this._debug('lookupSyncHost: response %s', body);

        const s = body.match(/window.synccheck={retcode:"(.*)",selector:"(.*)"}/);
        if (s) {
          const [_, retcode, selector] = s;
          if (retcode == 0) {
            this._debug('lookupSyncHost: ok %s', url);
            this.session.syncCheckUrl = url;
            break;
          }
        }
      } catch (err) {
        this._debug('lookupSyncHost: test, err=%s', err);
      }
    }

    return !!this.session.syncCheckUrl;

  }

  async wxSyncCheck() {

    this._debug('wxSyncCheck');
    const {response, body} = await this.request({
      method: 'GET',
      url: this.session.syncCheckUrl + `?sid=${this.session.wxsid}&skey=${this.session.skey}&uin=${this.session.wxuin}&deviceid=${this.session.deviceId}&synckey=${this.getSyncKeyString()}&r=${utils.getTimestamp()}&_=${utils.getTimestamp()}`,
    });

    const s = body.match(/window.synccheck={retcode:"(.*)",selector:"(.*)"}/);
    if (s) {

      const [_, retcode, selector] = s;
      this._debug('wxSyncCheck: retcode=%s, selector=%s', retcode, selector);

      if (retcode == 1100) {
        return this.emit('logout');
      }

      if (retcode != 0) {
        return this.emit('error', new Error(`wxSyncCheck failed with code #${retcode}`));
      }

      if (selector == 2) {
        await this.wxSync();
      }

      if (selector == 7) {
        this.emit('change status');
      }

    }

  }

  async wxSync() {

    this._debug('wxSync: request');
    const {response, body} = await this.request({
      method: 'POST',
      url: config.api.sync + `?sid=${this.session.wxsid}&skey=${this.session.skey}&pass_ticket=${this.session.pass_ticket}`,
      headers: {
        'content-type': 'application/json; charset=UTF-8',
      },
      json: true,
      body: {
        BaseRequest: this.getBaseRequest(),
        SyncKey: this.getSyncKey(),
        rr: ~utils.getTimestamp(),
      },
    });

    if (body.SyncKey) {
      this.setSyncKey(body.SyncKey);
    }

    if (body.AddMsgList) {
      for (const item of body.AddMsgList) {
        item.Content = utils.tryParseXMLMessageContent(item.Content);
        this.emit('message', item);
      }
    }

  }

  async login() {

    const status = {};

    this._debug('login: getLoginQRCode');
    await this.getUuid();
    const {qrcode, image} = await this.getLoginQRCode();
    this.emit('login', qrcode, image);

    while (true) {
      await utils.sleep(100);
      const {code, url} = await this.checkLoginStatus();
      this._debug('login: status, code=%s, url=%s', code, url);
      if (code === 200) {
        status.url = url;
        break;
      } else if (code === 201) {
        this._debug('login: waiting user confirm login');
      } else if (code === 408) {
        this._debug('login: timeout');
      } else {
        this.emit('error', new Error(`login failed waith status code ${code}`));
      }
    }

    this._debug('login: wxNewLoginPage');
    await this.wxNewLoginPage(status.url + '&fun=' + config.fun);

    this._debug('login: wxInit');
    await this.wxInit();

    this.loop();

  }

  async loop() {

    this._debug('start loop');

    this.once('logout', () => {
      this.continueLoop = false;
    });

    this.continueLoop = await this.lookupSyncHost();

    while (this.continueLoop) {

      await this.wxSync();
      await this.wxSyncCheck();

    }

  }

}
