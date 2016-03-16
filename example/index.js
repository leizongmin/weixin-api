'use strict';

const WeixinAPI = require('../');

const wx = new WeixinAPI();


wx.login()
.then(console.log)
.catch(console.log)
