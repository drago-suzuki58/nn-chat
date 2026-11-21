'use strict';
const postsHandler = require('./posts-handler');
const util = require('./handler-util');

async function route(req, res) {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    util.handleNotFound(req, res);
    return;
  }
  const pathname = req.url.split('?')[0];
  try {
    switch (pathname) {
      case '/posts':
        await postsHandler.handle(req, res);
        break;
      case '/posts/delete':
        await postsHandler.handleDelete(req, res);
        break;
      case '/logout':
        util.handleLogout(req, res);
        break;
      case '/changeTheme':
        util.handleChangeTheme(req, res);
        break;
      case '/favicon.ico':
        util.handleFavicon(req, res);
        break;
      case '/style.css':
        util.handleStyleCssFile(req, res);
        break;
      case '/nn-chat.js':
        util.handleNnChatJsFile(req, res);
        break;
      case '/':
        util.handleTopPage(req, res);
        break;
      default:
        util.handleNotFound(req, res);
        break;
    }
  } catch (e) {
    console.error('Request Error', e);
    if (res.headersSent) {
      res.end();
    } else {
      util.handleInternalServerError(req, res);
    }
  }
}

module.exports = {
  route
};
