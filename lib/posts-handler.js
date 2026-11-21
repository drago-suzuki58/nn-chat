'use strict';
const pug = require('pug');
const Cookies = require('cookies');
const prisma = require('./prisma');
const util = require('./handler-util');
const { isValidCsrfToken } = require('./session');
const { currentThemeKey } = require('../config');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/ja');
dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.tz.setDefault('Asia/Tokyo');

const maxContentLength = 1000;

async function handle(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = cookies.get(currentThemeKey) || 'light';
  const options = { maxAge: 30 * 86400 * 1000 };
  cookies.set(currentThemeKey, currentTheme, options);
  switch (req.method) {
    case 'GET': {
      const posts = await prisma.post.findMany({
        orderBy: {
          id: 'asc'
        },
        include: {
          user: {
            select: { username: true, isAdmin: true }
          }
        }
      });
      posts.forEach((post) => {
        post.relativeCreatedAt = dayjs(post.createdAt).tz().fromNow();
        post.absoluteCreatedAt = dayjs(post.createdAt).tz().format('YYYY年MM月DD日 HH時mm分ss秒');
      });
      const html = pug.renderFile('./views/posts.pug', {
        currentTheme,
        posts,
        user: req.user,
        csrfToken: req.session.csrfToken,
        maxContentLength
      });
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      res.end(html);
      console.info(
        `閲覧されました: user: ${req.user.username}, ` +
        `remoteAddress: ${req.socket.remoteAddress}, ` +
        `userAgent: ${req.headers['user-agent']} `
      );
      break;
    }
    case 'POST': {
      const params = new URLSearchParams(await util.readBody(req));
      const content = params.get('content');
      if (!isValidCsrfToken(req.session, params.get('csrfToken'))) {
        util.handleBadRequest(req, res);
        return;
      }
      if (!content) {
        util.handleRedirect(req, res, '/posts');
        return;
      }
      if (content.length > maxContentLength) {
        util.handleBadRequest(req, res);
        return;
      }
      console.info(`送信されました: ${content}`);
      await prisma.post.create({
        data: {
          content,
          userId: req.user.id
        }
      });
      util.handleRedirect(req, res, '/posts');
      break;
    }
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

async function handleDelete(req, res) {
  if (req.method !== 'POST') {
    util.handleBadRequest(req, res);
    return;
  }
  const params = new URLSearchParams(await util.readBody(req));
  const id = parseInt(params.get('id'));
  if (!isValidCsrfToken(req.session, params.get('csrfToken'))) {
    util.handleBadRequest(req, res);
    return;
  }
  if (!id) {
    util.handleBadRequest(req, res);
    return;
  }
  const post = await prisma.post.findUnique({
    where: { id }
  });
  if (!post) {
    util.handleBadRequest(req, res);
    return;
  }
  if (req.user.id !== post.userId && !req.user.isAdmin) {
    util.handleForbidden(req, res);
    return;
  }
  await prisma.post.delete({
    where: { id }
  });
  console.info(
    `削除されました: user: ${req.user.username}, ` +
      `remoteAddress: ${req.socket.remoteAddress}, ` +
      `userAgent: ${req.headers['user-agent']} `
  );
  util.handleRedirect(req, res, '/posts');
}

module.exports = {
  handle,
  handleDelete,
};