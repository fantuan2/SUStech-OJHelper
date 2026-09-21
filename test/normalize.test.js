'use strict';

// Load lib files; they attach to globalThis.
require('../src/lib/core.js');
require('../src/lib/i18n.js');
require('../src/lib/langs/java.js');
require('../src/lib/langs/cc.js');
require('../src/lib/settings.js');

const assert = require('assert');
const OJHCore = globalThis.OJHCore;
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

function javaWith(code, settingsPatch) {
  const opts = OJHSettings.optionsFor('java', settingsPatch || {});
  return OJHCore.normalize(code, 'java', opts);
}

function java(code) {
  return javaWith(code);
}

test('registry: java registered, cc placeholder', () => {
  assert.ok(OJHCore.getLanguage('java'));
  assert.ok(OJHCore.getLanguage('cc'));
  assert.strictEqual(OJHCore.supported('java'), true);
  assert.strictEqual(OJHCore.supported('cc'), false);
  assert.strictEqual(OJHCore.supported('cc.cc98'), false);
  assert.strictEqual(OJHCore.supported('cpp'), false);
});

test('langKey normalization', () => {
  assert.strictEqual(OJHCore.langKey('cc.cc98'), 'cc');
  assert.strictEqual(OJHCore.langKey('Java'), 'java');
  assert.strictEqual(OJHCore.langKey('cpp'), 'cpp');
  assert.strictEqual(OJHCore.getLanguage('cpp').id, 'cc');
});

test('removes package declaration', () => {
  const r = java('package com.example.app;\n\npublic class A {\n  public static void main(String[] args){}\n}\n');
  assert.ok(!/package/.test(r.code));
  assert.ok(r.changes.some(c => c.id === 'package'));
});

test('renames main class to Main', () => {
  const r = java('public class Solution {\n  public static void main(String[] args){}\n}\n');
  assert.ok(/public class Main\b/.test(r.code), r.code);
  assert.ok(!/\bSolution\b/.test(r.code));
  assert.ok(r.changes.some(c => c.id === 'rename'));
});

test('renames constructor alongside class', () => {
  const r = java('public class Sol {\n  Sol(){}\n  public static void main(String[] args){}\n}\n');
  assert.ok(/class Main/.test(r.code));
  assert.ok(/Main\(\)\{\}/.test(r.code), r.code);
});

test('normalizes main signature', () => {
  const r = java('public class Main {\n  static void main(String[] args) {}\n}\n');
  assert.ok(r.code.includes('public static void main(String[] args)'), r.code);
  assert.ok(r.changes.some(c => c.id === 'main-signature'));
});

test('already normalized -> no changes', () => {
  const code = 'public class Main {\n    public static void main(String[] args) {\n    }\n}\n';
  const r = java(code);
  assert.strictEqual(r.changes.length, 0, JSON.stringify(r.changes));
  assert.strictEqual(r.code, code);
});

test('renames only the class containing main', () => {
  const r = java('class Helper {}\n\npublic class Solution {\n  public static void main(String[] args){}\n}\n');
  assert.ok(/class Helper/.test(r.code));
  assert.ok(/class Main/.test(r.code));
});

test('renames non-public class that has main', () => {
  const r = java('class Foo {\n  public static void main(String[] args){}\n}\n');
  assert.ok(/class Main/.test(r.code));
});

test('no main is inserted when missing', () => {
  const r = java('public class LongNameSolution {\n    int x;\n}\n');
  assert.ok(/class Main\b/.test(r.code), r.code);
  assert.ok(!r.code.includes('static void main'), 'must not insert main:\n' + r.code);
  assert.ok(!r.changes.some(c => c.id === 'insert-main'));
  assert.ok(r.changes.some(c => c.id === 'rename'));
});

test('strips BOM', () => {
  const r = java('\uFEFFpublic class Main {\n  public static void main(String[] args){}\n}\n');
  assert.strictEqual(r.code.charCodeAt(0), 'p'.charCodeAt(0));
  assert.ok(r.changes.some(c => c.id === 'bom'));
});

test('does not rename inside strings or comments', () => {
  const code = 'public class Solution {\n  // Solution comment\n  String s = "Solution";\n  public static void main(String[] args){}\n}\n';
  const r = java(code);
  assert.ok(r.code.includes('// Solution comment'), r.code);
  assert.ok(r.code.includes('"Solution"'), r.code);
  assert.ok(/public class Main\b/.test(r.code));
});

test('custom main class name via per-language settings', () => {
  const r = javaWith('public class Solution {\n  public static void main(String[] args){}\n}\n',
    { languages: { java: { mainClass: 'Answer' } } });
  assert.ok(/public class Answer\b/.test(r.code));
});

test('custom main signature via per-language settings', () => {
  const r = javaWith('public class Main {\n  public static void main(String[] args){}\n}\n',
    { languages: { java: { mainSignature: 'public static void main(String[] argv)' } } });
  assert.ok(r.code.includes('public static void main(String[] argv)'), r.code);
});

test('keeps comments by default (common option)', () => {
  const code = 'public class Main {\n  // hello\n  public static void main(String[] args) {}\n}\n';
  const r = java(code);
  assert.ok(r.code.includes('// hello'), r.code);
  assert.ok(!r.changes.some(c => c.id === 'comments'));
});

test('removeComments: true strips line and block comments', () => {
  const code = 'public class Main {\n  // hello\n  /* block\n     comment */\n  public static void main(String[] args) {}\n}\n';
  const r = javaWith(code, { common: { removeComments: true } });
  assert.ok(!r.code.includes('hello'), r.code);
  assert.ok(!r.code.includes('block'), r.code);
  assert.ok(!/\/\*/.test(r.code), r.code);
  assert.ok(r.changes.some(c => c.id === 'comments'));
});

test('removeComments keeps // inside strings', () => {
  const code = 'public class Main {\n  String u = "http://x";\n  public static void main(String[] args) {}\n}\n';
  const r = javaWith(code, { common: { removeComments: true } });
  assert.ok(r.code.includes('"http://x"'), r.code);
});

test('unsupported language returns code untouched', () => {
  const r = OJHCore.normalize('int main(){return 0;}', 'cc');
  assert.strictEqual(r.supported, false);
  assert.strictEqual(r.changes.length, 0);
  assert.strictEqual(r.code, 'int main(){return 0;}');
});

test('empty input is safe', () => {
  const r = java('');
  assert.strictEqual(r.code, '');
  assert.strictEqual(r.changes.length, 0);
});

test('leading/trailing whitespace is left untouched', () => {
  const code = '\n\n  public class Main {\n  public static void main(String[] args){}\n}  \n\n';
  const r = java(code);
  assert.ok(!r.changes.some(c => c.id === 'whitespace'), JSON.stringify(r.changes));
  assert.strictEqual(r.code, code);
});

test('extensibility: a new language module plugs in via register', () => {
  OJHCore.register({
    id: 'fake',
    name: 'Fake',
    aliases: ['fake'],
    implemented: true,
    schema: [{ key: 'shout', type: 'checkbox', labelKey: 'x', default: true }],
    defaults: { shout: true },
    normalize: function (code, opts) {
      return opts.shout
        ? { code: String(code).toUpperCase(), changes: [{ id: 'shout', label: 'shout' }] }
        : { code: String(code), changes: [] };
    }
  });
  assert.strictEqual(OJHCore.supported('fake'), true);
  const r = OJHCore.normalize('abc', 'fake', { shout: true });
  assert.strictEqual(r.code, 'ABC');
  assert.ok(r.changes.some(c => c.id === 'shout'));
  const r2 = OJHCore.normalize('abc', 'fake', { shout: false });
  assert.strictEqual(r2.code, 'abc');
  assert.strictEqual(OJHCore.langKey('fake.fake'), 'fake');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
