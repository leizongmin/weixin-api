'use strict';

const repl = require('repl');
const WeixinAPI = require('../');

const wx = new WeixinAPI();


wx.login()
.then(() => {
  console.log('done');
  global.wx = wx;
  repl.start('> ').on('exit', () => {
    process.exit();
  });
})
.catch(console.log)
