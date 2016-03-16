'use strict';

/**
 * wxapi
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import request from 'request';
import QRCodeTerminal from 'qrcode-terminal';
import _createDebug from 'debug';
const debug = _createDebug('wxapi:utils');

export function createDebug(name) {
  return _createDebug('wxapi:' + name);
}

export function getTimestamp() {
  return new Date().getTime();
}

let sendRequestCounter = 0;
export function sendRequest(options) {
  const i = sendRequestCounter++;
  debug('sendRequest[#%s]: request, %s %s qs=%j, form=%j', i, options.method, options.url, options.qs, options.form);
  options.headers = options.headers || {};
  options.headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36';
  options.headers['referer'] = 'https://wx.qq.com/';
  debug('sendRequest[#%s]: request, headers=%j', i, options.headers);
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) {
        debug('sendRequest[#%s]: response, err=%s', i, err);
        return reject(err);
      } else {
        debug('sendRequest[#%s]: response, headers=%j, body=%s', i, response.headers, body);
        resolve({response, body});
      }
    });
  });
}

export function generateQRCode(text) {
  debug('generateQRCode: %s', text);
  return new Promise((resolve, reject) => {
    QRCodeTerminal.generate(text, ret => {
      resolve(ret);
    });
  });
}

export function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}
