'use strict';

/**
 * wxapi
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import request from 'request';
import QRCodeTerminal from 'qrcode-terminal';
import xml2json from 'xml2json';
import _createDebug from 'debug';
const debug = _createDebug('wxapi:utils');

//request.debug = _createDebug('wxapi:request');

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
  options.headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2652.0 Safari/537.36';
  options.headers['accept'] = 'application/json, text/plain, */*';
  options.headers['accept-language'] = 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4';
  options.headers['referer'] = 'https://wx.qq.com/';

  debug('sendRequest[#%s]: request, headers=%j', i, options.headers);
  return new Promise((resolve, reject) => {

    request(options, (err, response, body) => {
      if (err) {
        debug('sendRequest[#%s]: response, err=%s', i, err);
        return reject(err);
      } else {
        debug('sendRequest[#%s]: response, headers=%j, body=%j', i, response.headers, /*body*/);
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
  debug('sleep: %sms', ms);
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

export function xmlToJSON(xml) {
  return xml2json.toJson(xml, {
    object: true,
  });
}

export function generateDeviceID() {
  return 'e' + Math.random().toFixed(15).toString().substr(2, 17);
}

export function tryDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    debug('tryDecodeURIComponent: err=%s, str=%s', err, str);
    return str;
  }
}

export function parseCookie(str) {
  let list = str.split(';').map(s => {
    const [name,value] = s.split('=');
    return {name: name.trim(), value: tryDecodeURIComponent(value.trim())};
  });
  const ret = {name: list[0].name, value: list[0].value};
  list = list.slice(1);
  for (const item of list) {
    const name = item.name.toLowerCase();
    if (name === 'expires') {
      ret.expires = new Date(item.value);
    } else {
      ret[name] = item.value;
    }
  }
  return ret;
}

export function serializeCookies (obj) {
  const list = [];
  for (const i in obj) {
    list.push(`${i}=${encodeURIComponent(obj[i])}`);
  }
  return list.join('; ');
}

export function tryParseJSON(str) {
  try {
    const data = JSON.parse(str);
    return data;
  } catch (err) {
    debug('tryParseJSON failed: err=%s, str=%s', err, str);
    return str;
  }
}

export function tryParseXMLMessageContent(content) {
  if (typeof content === 'string' && /&lt;.*&gt;/.test(content)) {
    return xmlToJSON(content.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  } else {
    return content;
  }
}
