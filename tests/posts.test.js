'use strict';
const pug = require('pug');
const test = require('node:test');
const assert = require('node:assert');

test('チャットメッセージに含まれる HTML タグがエスケープされる', () => {
  const html = pug.renderFile(
    './views/posts.pug',
    {
      currentTheme: 'light',
      posts: [
        {
          id: 1,
          content: '<script>alert("XSS!");</script>',
          userId: 1,
          user: { username: 'test_user', isAdmin: false },
          createdAt: new Date(),
        },
      ],
      user: { id: 1, username: 'test_user', isAdmin: false },
      csrfToken: 'token',
      maxContentLength: 1000,
    },
  );

  // メッセージの <script> タグがエスケープされていることをチェック
  assert(html.includes('&lt;script&gt;alert(&quot;XSS!&quot;);&lt;/script&gt;'));
});
