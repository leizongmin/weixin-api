'use strict';

const repl = require('repl');
const WeixinAPI = require('../');

const wx = new WeixinAPI();

wx.on('login', (qrcode, image) => {
  console.log(qrcode);
  console.log(image);
});

wx.login()
.then(() => {
  global.wx = wx;
  repl.start('> ').on('exit', () => {
    process.exit();
  });
})
.catch(console.log)
