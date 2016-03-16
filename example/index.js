'use strict';

const repl = require('repl');
const WeixinAPI = require('../');

const wx = new WeixinAPI();

wx.on('error', err => {
  console.log(err);
});

wx.on('logout', () => {
  console.log('logout');
});

wx.on('login', (qrcode, image) => {
  console.log(qrcode);
  console.log(image);
});

wx.on('message', m => {
  console.log('new message', m);
});

wx.on('change status', () => {
  console.log('change status');
});

wx.login()
.then(() => {
  global.wx = wx;
  repl.start('> ').on('exit', () => {
    process.exit();
  });
})
.catch(console.log)
