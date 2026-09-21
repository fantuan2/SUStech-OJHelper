'use strict';

require('../src/lib/i18n.js');

const assert = require('assert');
const OJHI18n = globalThis.OJHI18n;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('ok   - ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL - ' + name);
    console.log('       ' + (e && e.message));
  }
}

test('mapLang: zh variants -> zh', () => {
  assert.strictEqual(OJHI18n.mapLang('zh'), 'zh');
  assert.strictEqual(OJHI18n.mapLang('zh_TW'), 'zh');
  assert.strictEqual(OJHI18n.mapLang('zh-TW'), 'zh');
  assert.strictEqual(OJHI18n.mapLang('zh-Hant'), 'zh');
  assert.strictEqual(OJHI18n.mapLang('zh-CN'), 'zh');
  assert.strictEqual(OJHI18n.mapLang('ZH'), 'zh');
});

test('mapLang: non-zh -> en', () => {
  assert.strictEqual(OJHI18n.mapLang('en'), 'en');
  assert.strictEqual(OJHI18n.mapLang('ko'), 'en');
  assert.strictEqual(OJHI18n.mapLang('en-US'), 'en');
  assert.strictEqual(OJHI18n.mapLang(''), 'en');
  assert.strictEqual(OJHI18n.mapLang(null), 'en');
});

test('t(): english ui', () => {
  OJHI18n.setLang('en');
  assert.strictEqual(OJHI18n.t('normalizeBtn'), 'Normalize');
  assert.strictEqual(OJHI18n.t('normalizedBtn'), 'Normalized');
  assert.strictEqual(OJHI18n.t('changeSettings'), 'Change normalize settings');
  assert.strictEqual(OJHI18n.t('status.live'), 'Live');
});

test('t(): chinese ui', () => {
  OJHI18n.setLang('zh');
  assert.strictEqual(OJHI18n.t('normalizeBtn'), '规范化');
  assert.strictEqual(OJHI18n.t('normalizedBtn'), '已规范');
  assert.strictEqual(OJHI18n.t('changeSettings'), '更改规范化设置');
  assert.strictEqual(OJHI18n.t('status.live'), '进行中');
  assert.strictEqual(OJHI18n.t('opt.showCountdown'), '在比赛列表和首页显示倒计时横幅');
});

test('t(): {var} interpolation', () => {
  OJHI18n.setLang('zh');
  assert.strictEqual(OJHI18n.t('normalizedToast', { list: 'a、b' }), '已规范化：a、b');
  OJHI18n.setLang('en');
  assert.strictEqual(OJHI18n.t('unsupportedToast', { lang: 'cc.cc98' }), 'This language (cc.cc98) is not supported yet');
});

test('t(): unknown key falls back to the key itself', () => {
  assert.strictEqual(OJHI18n.t('no.such.key'), 'no.such.key');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
