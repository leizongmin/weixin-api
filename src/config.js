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
// 检查登录状态
config.api.loginStatus = 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login';
