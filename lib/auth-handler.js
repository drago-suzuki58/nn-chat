'use strict';
const pug = require('pug');
const prisma = require('./prisma');
const util = require('./handler-util');
const { hashPassword, verifyPassword } = require('./password');
const { createSession, loadSession, destroySession, isValidCsrfToken } = require('./session');

// 存在しないユーザ名でも照合処理を行い、応答時間からユーザの有無を推測されにくくする
const dummyPasswordHash = hashPassword('dummy-password');

function renderLogin(req, res, statusCode, errorMessage) {
  const currentTheme = util.getCurrentTheme(req, res);
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(pug.renderFile('./views/login.pug', {
    currentTheme,
    errorMessage
  }));
}

async function handleLogin(req, res) {
  switch (req.method) {
    case 'GET':
      if (await loadSession(req, res)) {
        util.handleRedirect(req, res, '/posts');
        return;
      }
      renderLogin(req, res, 200);
      break;
    case 'POST': {
      const params = new URLSearchParams(await util.readBody(req));
      const username = params.get('username') || '';
      const password = params.get('password') || '';
      const user = await prisma.user.findUnique({ where: { username } });
      const isValid = await verifyPassword(password, user ? user.passwordHash : await dummyPasswordHash);
      if (!user || !isValid) {
        console.info(
          `ログインに失敗しました: username: ${username}, ` +
          `remoteAddress: ${req.socket.remoteAddress}`
        );
        renderLogin(req, res, 401, 'ユーザ名またはパスワードが違います');
        return;
      }
      await createSession(req, res, user.id);
      console.info(
        `ログインしました: user: ${user.username}, ` +
        `remoteAddress: ${req.socket.remoteAddress}`
      );
      util.handleRedirect(req, res, '/posts');
      break;
    }
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    util.handleBadRequest(req, res);
    return;
  }
  const params = new URLSearchParams(await util.readBody(req));
  if (!isValidCsrfToken(req.session, params.get('csrfToken'))) {
    util.handleBadRequest(req, res);
    return;
  }
  await destroySession(req, res, req.session);
  util.handleRedirect(req, res, '/login');
}

module.exports = {
  handleLogin,
  handleLogout,
};
