'use strict';
const fs = require('node:fs');
const Cookies = require('cookies');
const { currentThemeKey } = require('../config');

function handleRedirect(req, res, location) {
  res.writeHead(303, {
    'Location': location
  });
  res.end();
}

function handleChangeTheme(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = (cookies.get(currentThemeKey) !== 'light' ? 'light' : 'dark');
  cookies.set(currentThemeKey, currentTheme);
  handleRedirect(req, res, '/posts');
}

function handleFavicon(req, res) {
  res.writeHead(200, {
    'Content-Type': 'image/vnd.microsoft.icon',
    'Cache-Control': 'public, max-age=604800'
  });
  const favicon = fs.readFileSync('./favicon.ico');
  res.end(favicon);
}

function handleStyleCssFile(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/css',
  });
  const file = fs.readFileSync('./public/style.css');
  res.end(file);
}

function handleNnChatJsFile(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/javascript',
  });
  const file = fs.readFileSync('./public/nn-chat.js');
  res.end(file);
}

function handleTopPage(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.write('<h1>NNチャットの入口</h1>');
  res.write('<p><a href="/posts">NNチャット</a></p>');
  res.end();
}

function handleNotFound(req, res) {
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.write('<p>ページがみつかりません</p>');
  res.write('<p><a href="/posts">NNチャット</a></p>');
  res.end();
}

function handleBadRequest(req, res) {
  res.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('未対応のリクエストです');
}

function handleForbidden(req, res) {
  res.writeHead(403, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('この操作は許可されていません');
}

function handleInternalServerError(req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('サーバでエラーが発生しました');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    }).on('end', () => {
      resolve(body);
    }).on('error', reject);
  });
}

module.exports = {
  handleRedirect,
  handleChangeTheme,
  handleFavicon,
  handleStyleCssFile,
  handleNnChatJsFile,
  handleTopPage,
  handleNotFound,
  handleBadRequest,
  handleForbidden,
  handleInternalServerError,
  readBody,
};