'use strict';
const pug = require('pug');
const prisma = require('./prisma');
const util = require('./handler-util');
const { isValidCsrfToken } = require('./session');
const { postUserSelect, addPostTimes, formatDate } = require('./post-format');

const maxDisplayNameLength = 32;
const maxBioLength = 500;

function renderPage(res, view, options) {
  const html = pug.renderFile(view, options);
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(html);
}

async function handleProfile(req, res, username) {
  if (req.method !== 'GET') {
    util.handleBadRequest(req, res);
    return;
  }
  const profileUser = await prisma.user.findUnique({
    where: { username },
    select: {
      ...postUserSelect,
      bio: true,
      createdAt: true,
      posts: {
        orderBy: { id: 'desc' },
        include: { user: { select: postUserSelect } }
      }
    }
  });
  if (!profileUser) {
    util.handleNotFound(req, res);
    return;
  }
  addPostTimes(profileUser.posts);
  renderPage(res, './views/user.pug', {
    currentTheme: util.getCurrentTheme(req, res),
    user: req.user,
    csrfToken: req.session.csrfToken,
    profileUser,
    joinedAt: formatDate(profileUser.createdAt)
  });
}

async function handleProfileEdit(req, res) {
  switch (req.method) {
    case 'GET':
      renderPage(res, './views/profile-edit.pug', {
        currentTheme: util.getCurrentTheme(req, res),
        user: req.user,
        csrfToken: req.session.csrfToken,
        maxDisplayNameLength,
        maxBioLength
      });
      break;
    case 'POST': {
      const params = new URLSearchParams(await util.readBody(req));
      if (!isValidCsrfToken(req.session, params.get('csrfToken'))) {
        util.handleBadRequest(req, res);
        return;
      }
      // 空欄は未設定として保存し、表示時はユーザ名で代用する
      const displayName = (params.get('displayName') || '').trim() || null;
      const bio = util.normalizeNewlines(params.get('bio') || '').trim() || null;
      if (displayName && displayName.length > maxDisplayNameLength) {
        util.handleBadRequest(req, res);
        return;
      }
      if (bio && bio.length > maxBioLength) {
        util.handleBadRequest(req, res);
        return;
      }
      await prisma.user.update({
        where: { id: req.user.id },
        data: { displayName, bio }
      });
      console.info(`プロフィールが更新されました: user: ${req.user.username}`);
      util.handleRedirect(req, res, `/users/${req.user.username}`);
      break;
    }
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

module.exports = {
  handleProfile,
  handleProfileEdit,
};
