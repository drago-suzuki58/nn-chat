'use strict';
// 使い方: node scripts/create-user.js --username <ユーザ名> --password <パスワード> [--admin]
const { parseArgs } = require('node:util');
const prisma = require('../lib/prisma');
const { hashPassword } = require('../lib/password');
const { usernamePattern } = require('../config');

const minPasswordLength = 8;

async function main() {
  const { values } = parseArgs({
    options: {
      username: { type: 'string' },
      password: { type: 'string' },
      admin: { type: 'boolean', default: false }
    }
  });
  const { username, password, admin } = values;
  if (!username || !usernamePattern.test(username)) {
    throw new Error('--username には英数字・アンダースコア・ハイフンで 1〜32 文字を指定してください');
  }
  if (!password || password.length < minPasswordLength) {
    throw new Error(`--password には ${minPasswordLength} 文字以上を指定してください`);
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new Error(`ユーザ ${username} は既に存在します`);
  }
  await prisma.user.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      isAdmin: admin
    }
  });
  console.info(`ユーザ ${username} を作成しました${admin ? '（管理者）' : ''}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
