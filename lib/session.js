'use strict';
const crypto = require('node:crypto');
const Cookies = require('cookies');
const prisma = require('./prisma');
const { sessionCookieKey } = require('../config');

const sessionMaxAge = 7 * 86400 * 1000;
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction
};

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createCookies(req, res) {
  // 本番では HTTPS 終端がプロキシ側にあるため、接続が暗号化済みであることを明示する
  return new Cookies(req, res, { secure: isProduction });
}

async function createSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionMaxAge);
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      csrfToken: crypto.randomBytes(32).toString('base64url'),
      expiresAt
    }
  });
  createCookies(req, res).set(sessionCookieKey, token, { ...cookieOptions, expires: expiresAt });
}

async function loadSession(req, res) {
  const token = createCookies(req, res).get(sessionCookieKey);
  if (!token) {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });
  if (!session) {
    return null;
  }
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { tokenHash: session.tokenHash } });
    return null;
  }
  return session;
}

async function destroySession(req, res, session) {
  await prisma.session.deleteMany({ where: { tokenHash: session.tokenHash } });
  createCookies(req, res).set(sessionCookieKey, null, cookieOptions);
}

function isValidCsrfToken(session, token) {
  if (!token) {
    return false;
  }
  const expected = Buffer.from(session.csrfToken);
  const actual = Buffer.from(token);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = {
  createSession,
  loadSession,
  destroySession,
  isValidCsrfToken,
};
