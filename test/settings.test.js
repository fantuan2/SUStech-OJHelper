'use strict';

require('../src/lib/core.js');
require('../src/lib/i18n.js');
require('../src/lib/langs/java.js');
require('../src/lib/langs/cc.js');
require('../src/lib/settings.js');

const assert = require('assert');
const OJHSettings = globalThis.OJHSettings;

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

// Synchronous fake of chrome.storage.sync (deterministic for tests).
function fakeStorage(initial) {
  const data = Object.assign({}, initial || {});
  const calls = { set: [], remove: [] };
  return {
    data,
    calls,
    get: function (k, cb) { cb(JSON.parse(JSON.stringify(data))); },
    set: function (o, cb) {
      Object.assign(data, JSON.parse(JSON.stringify(o)));
      calls.set.push(JSON.parse(JSON.stringify(o)));
      if (cb) cb();
    },
    remove: function (keys, cb) {
      (Array.isArray(keys) ? keys : [keys]).forEach(function (k) { delete data[k]; });
      calls.remove.push(keys);
      if (cb) cb();
    }
  };
}

test('defaults shape (v2, no notify, no insertMainIfMissing)', () => {
  const d = OJHSettings.defaults();
  assert.strictEqual(d.schemaVersion, 2);
  assert.deepStrictEqual(d.common, { removeComments: false, showContestCountdown: true, showContinueButton: true });
  assert.ok(d.languages.java);
  assert.strictEqual(d.languages.java.mainClass, 'Main');
  assert.strictEqual(d.languages.java.mainSignature, 'public static void main(String[] args)');
  assert.ok(!('cc' in d.languages), 'placeholder languages must not appear in defaults');
  assert.ok(!('notify' in d), 'notify section removed');
  const flat = JSON.stringify(d);
  assert.ok(!flat.includes('insertMainIfMissing'), 'insertMainIfMissing removed');
});

test('migrate(): empty storage -> defaults, no migration', () => {
  const r = OJHSettings.migrate({});
  assert.strictEqual(r.migrated, false);
  assert.strictEqual(r.legacyKeys.length, 0);
  assert.strictEqual(r.settings.schemaVersion, 2);
});

test('migrate(): legacy flat keys -> v2, legacy keys reported', () => {
  const r = OJHSettings.migrate({
    mainClass: 'Foo',
    mainSignature: 'public static void main(String[] a)',
    removeComments: true,
    insertMainIfMissing: false,
    notifyEnabled: true,
    notifyThresholds: [30]
  });
  assert.strictEqual(r.migrated, true);
  assert.strictEqual(r.legacyKeys.length, 6);
  assert.strictEqual(r.settings.common.removeComments, true);
  assert.strictEqual(r.settings.languages.java.mainClass, 'Foo');
  assert.strictEqual(r.settings.languages.java.mainSignature, 'public static void main(String[] a)');
  assert.ok(!('insertMainIfMissing' in r.settings.languages.java));
});

test('migrate(): v2 values win over stale legacy keys', () => {
  const r = OJHSettings.migrate({
    schemaVersion: 2,
    common: { removeComments: false },
    languages: { java: { mainClass: 'New' } },
    mainClass: 'Old',
    removeComments: true
  });
  assert.strictEqual(r.settings.common.removeComments, false);
  assert.strictEqual(r.settings.languages.java.mainClass, 'New');
  assert.strictEqual(r.migrated, true, 'legacy keys still cleaned up');
});

test('migrate(): v2 partial storage is merged over defaults, idempotent', () => {
  const r1 = OJHSettings.migrate({ schemaVersion: 2, common: { removeComments: true } });
  assert.strictEqual(r1.migrated, false);
  assert.strictEqual(r1.settings.common.removeComments, true);
  assert.strictEqual(r1.settings.common.showContestCountdown, true);
  assert.strictEqual(r1.settings.languages.java.mainClass, 'Main');
  const r2 = OJHSettings.migrate(r1.settings);
  assert.strictEqual(r2.migrated, false);
  assert.deepStrictEqual(r1.settings, r2.settings);
});

test('get(): migrates legacy storage, writes v2 and removes legacy keys', () => {
  const store = fakeStorage({ mainClass: 'Legacy', removeComments: true });
  OJHSettings.setStorageAdapter(store);

  let s;
  OJHSettings.get(function (v) { s = v; });
  assert.strictEqual(s.schemaVersion, 2);
  assert.strictEqual(s.languages.java.mainClass, 'Legacy');
  assert.strictEqual(s.common.removeComments, true);
  assert.strictEqual(store.calls.set.length, 1, 'v2 written once');
  assert.ok(!('mainClass' in store.data), 'legacy mainClass removed');
  assert.ok(!('removeComments' in store.data), 'legacy removeComments removed');
  assert.strictEqual(store.data.schemaVersion, 2);

  // second read: no repeat migration
  OJHSettings.get(function () {});
  assert.strictEqual(store.calls.set.length, 1, 'idempotent');
});

test('get(): no adapter -> defaults', () => {
  OJHSettings.setStorageAdapter(null);
  let s;
  OJHSettings.get(function (v) { s = v; });
  assert.strictEqual(s.schemaVersion, 2);
  assert.strictEqual(s.common.showContestCountdown, true);
});

test('optionsFor(): merges common + language defaults', () => {
  const opts = OJHSettings.optionsFor('java', null);
  assert.strictEqual(opts.removeComments, false);
  assert.strictEqual(opts.showContestCountdown, true);
  assert.strictEqual(opts.mainClass, 'Main');
  assert.strictEqual(opts.mainSignature, 'public static void main(String[] args)');
});

test('optionsFor(): honors stored overrides per language', () => {
  const opts = OJHSettings.optionsFor('java', {
    common: { removeComments: true },
    languages: { java: { mainClass: 'Answer' } }
  });
  assert.strictEqual(opts.removeComments, true);
  assert.strictEqual(opts.mainClass, 'Answer');
  assert.strictEqual(opts.mainSignature, 'public static void main(String[] args)');
});

test('optionsFor(): unknown/hydro language codes fall back cleanly', () => {
  const opts = OJHSettings.optionsFor('cc.cc20o2', { common: { removeComments: true } });
  assert.strictEqual(opts.removeComments, true);
  assert.ok(!('mainClass' in opts), 'cc has no language options yet');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
