'use strict';

const repl = require('repl');
const WeixinAPI = require('../');

const wx = new WeixinAPI();

wx.on('error', err => {
  console.log(err);
  process.exit();
});

wx.on('logout', () => {
  console.log('logout');
});

wx.on('login', (qrcode, image) => {
  console.log(qrcode);
  console.log(image);
});

const message = new Map();
const messageIds = [];
wx.on('message', m => {
  message.set(m.MsgId, m);
  messageIds.push(m.MsgId);
  if (messageIds.length > 100) {
    const id = messageIds.shift();
    message.delete(id);
  }
  console.log('new message %s', m.MsgId);
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
