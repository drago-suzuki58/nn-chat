'use strict';
const pug = require('pug');
const test = require('node:test');
const assert = require('node:assert');

const xss = '<script>alert("XSS!");</script>';
const escapedXss = '&lt;script&gt;alert(&quot;XSS!&quot;);&lt;/script&gt;';

function renderProfile(viewer, profileUser) {
  return pug.renderFile('./views/user.pug', {
    currentTheme: 'light',
    user: viewer,
    csrfToken: 'token',
    profileUser: { posts: [], ...profileUser },
    joinedAt: '2026年01月01日',
  });
}

const viewer = { id: 1, username: 'viewer', displayName: null, isAdmin: false };

test('プロフィールの表示名と自己紹介に含まれる HTML タグがエスケープされる', () => {
  const html = renderProfile(viewer, {
    username: 'target',
    displayName: xss,
    bio: xss,
    isAdmin: false,
  });
  assert(!html.includes(xss));
  assert.strictEqual(html.split(escapedXss).length - 1, 2);
});

test('表示名が未設定ならユーザ名で表示され、ユーザ名は常に併記される', () => {
  const html = renderProfile(viewer, {
    username: 'target',
    displayName: null,
    bio: null,
    isAdmin: false,
  });
  assert(html.includes('target'));
  assert(html.includes('@target'));
});

test('編集ボタンは自分のプロフィールにだけ表示される', () => {
  const own = renderProfile(viewer, { ...viewer, bio: null });
  const other = renderProfile(viewer, { username: 'target', displayName: null, bio: null, isAdmin: false });
  assert(own.includes('href="/profile/edit"'));
  assert(!other.includes('href="/profile/edit"'));
});
