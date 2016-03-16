'use strict';

/**
 * wxapi
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

const config = {};
export default config;

// APP ID
config.appId = 'wx782c26e4c19acffb';
// 应用类型
config.fun = 'new';
// 语言
config.lang = 'zh_CN';

config.api = {};
// 获取 UUID
config.api.jsLogin = 'https://login.weixin.qq.com/jslogin';
// 生成二维码
config.api.qrcode = 'https://login.weixin.qq.com/l/';
config.api.qrcodeImage = 'https://login.weixin.qq.com/qrcode/';
// 检查登录状态
config.api.loginStatus = 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login';
// 微信初始化
config.api.init = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit';
// 检查新消息
config.api.syncCheck = 'https://webpush2.weixin.qq.com/cgi-bin/mmwebwx-bin/synccheck';
// 同步消息
config.api.sync = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsync';
