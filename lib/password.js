'use strict';
const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const keyLength = 64;

// 保存形式は "salt:hash"（どちらも hex）
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, keyLength);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
  const [salt, hash] = passwordHash.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = await scrypt(password, salt, keyLength);
  return crypto.timingSafeEqual(expected, actual);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
