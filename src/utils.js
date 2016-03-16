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

export function sendRequest(options) {
  debug('sendRequest: %s %s', options.method, options.url);
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      if (err) return reject(err);
      resolve({response, body});
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
