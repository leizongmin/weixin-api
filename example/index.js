'use strict';

const WeixinAPI = require('../');

const wx = new WeixinAPI();


wx.getLoginQRCode()
.then(console.log)
.catch(console.log)
