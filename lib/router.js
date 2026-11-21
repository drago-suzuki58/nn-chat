'use strict';
const postsHandler = require('./posts-handler');
const authHandler = require('./auth-handler');
const util = require('./handler-util');
const { loadSession } = require('./session');

// ログイン済みなら req.user と req.session を設定して true を返す
// 未ログインならログインページへ転送して false を返す
async function authenticate(req, res) {
  const session = await loadSession(req, res);
  if (!session) {
    util.handleRedirect(req, res, '/login');
    return false;
  }
  req.session = session;
  req.user = session.user;
  return true;
}

async function route(req, res) {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    util.handleNotFound(req, res);
    return;
  }
  const pathname = req.url.split('?')[0];
  try {
    switch (pathname) {
      case '/posts':
        if (await authenticate(req, res)) {
          await postsHandler.handle(req, res);
        }
        break;
      case '/posts/delete':
        if (await authenticate(req, res)) {
          await postsHandler.handleDelete(req, res);
        }
        break;
      case '/login':
        await authHandler.handleLogin(req, res);
        break;
      case '/logout':
        if (await authenticate(req, res)) {
          await authHandler.handleLogout(req, res);
        }
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
