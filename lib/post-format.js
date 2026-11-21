'use strict';
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

// 投稿者の表示に必要な項目だけを取得する
const postUserSelect = { username: true, displayName: true, isAdmin: true };

function addPostTimes(posts) {
  posts.forEach((post) => {
    post.relativeCreatedAt = dayjs(post.createdAt).tz().fromNow();
    post.absoluteCreatedAt = dayjs(post.createdAt).tz().format('YYYY年MM月DD日 HH時mm分ss秒');
  });
  return posts;
}

function formatDate(date) {
  return dayjs(date).tz().format('YYYY年MM月DD日');
}

module.exports = {
  postUserSelect,
  addPostTimes,
  formatDate,
};
