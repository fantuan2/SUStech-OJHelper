'use strict';

require('../src/lib/hydro.js');
require('../src/lib/registry.js');

const assert = require('assert');
const D = globalThis.OJHDetect;
const R = globalThis.OJHScripts;

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

// Minimal fake document implementing only querySelector.
function fakeDoc(selectors) {
  return {
    querySelector: function (sel) { return selectors[sel] || null; },
    body: selectors.__body || null
  };
}

test('isHydro: true when window.Hydro.api exists', () => {
  assert.strictEqual(D.isHydro({ Hydro: { api: {} } }, fakeDoc({})), true);
});

test('isHydro: true on meta generator=Hydro', () => {
  const doc = fakeDoc({
    'meta[name="generator"]': { getAttribute: function () { return 'Hydro OJ'; } }
  });
  assert.strictEqual(D.isHydro({}, doc), true);
});

test('isHydro: true on .nav__list--main', () => {
  const doc = fakeDoc({ '.nav__list--main': {} });
  assert.strictEqual(D.isHydro({}, doc), true);
});

test('isHydro: true on body.mode-- class', () => {
  const doc = fakeDoc({ __body: { className: 'mode--scratchpad' } });
  assert.strictEqual(D.isHydro({}, doc), true);
});

test('isHydro: false on unrelated page', () => {
  assert.strictEqual(D.isHydro({}, fakeDoc({})), false);
});

test('isHydro: false with no document', () => {
  assert.strictEqual(D.isHydro({ Hydro: null }, null), false);
});

test('registry: default origin recognized', () => {
  assert.strictEqual(R.isDefaultOrigin('https://acm.sustech.edu.cn'), true);
  assert.strictEqual(R.isDefaultOrigin('https://oj.example.com'), false);
});

test('registry: normalizeOrigin strips path/glob', () => {
  assert.strictEqual(R.normalizeOrigin('https://oj.example.com/*'), 'https://oj.example.com');
  assert.strictEqual(R.normalizeOrigin('https://oj.example.com/d/*'), 'https://oj.example.com');
  assert.strictEqual(R.normalizeOrigin('https://oj.example.com'), 'https://oj.example.com');
});

test('registry: descriptors target /d/* and are unique', () => {
  const d = R.descriptorsFor('https://oj.example.com');
  assert.strictEqual(d.length, 2);
  d.forEach(function (s) {
    assert.deepStrictEqual(s.matches, ['https://oj.example.com/d/*']);
  });
  assert.strictEqual(d[0].world, 'MAIN');
  assert.strictEqual(d[1].world, undefined);
  assert.notStrictEqual(d[0].id, d[1].id);
});

test('registry: isolated js includes hydro guard before content modules', () => {
  const js = R.ISOLATED.js;
  const hydroIdx = js.indexOf('src/lib/hydro.js');
  const coreIdx = js.indexOf('src/lib/core.js');
  const contentIdx = js.indexOf('src/content/isolated.js');
  assert.ok(coreIdx >= 0 && hydroIdx > coreIdx, 'hydro after core');
  assert.ok(contentIdx > hydroIdx, 'content modules after guard');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
