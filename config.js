const currentThemeKey = 'current_theme';
const sessionCookieKey = 'session';
// プロフィールの URL にも使うため、URL エンコード不要な文字に限定する
const usernamePattern = /^[A-Za-z0-9_-]{1,32}$/;

module.exports = {
  currentThemeKey,
  sessionCookieKey,
  usernamePattern
}