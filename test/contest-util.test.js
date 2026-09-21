'use strict';

require('../src/lib/i18n.js');
require('../src/lib/contest-util.js');

const assert = require('assert');
const U = globalThis.OJHContestUtil;

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

// -------------------------------------------------------------- navigation

const NAV = [
  { id: 'A', href: '/p/8', ac: true, active: false },
  { id: 'B', href: '/p/9', ac: true, active: false },
  { id: 'C', href: '/p/10', ac: false, active: true },
  { id: 'D', href: '/p/11', ac: false, active: false }
];

test('pickPrevNext: middle element has both neighbours', () => {
  const r = U.pickPrevNext(NAV, '/p/10');
  assert.strictEqual(r.index, 2);
  assert.strictEqual(r.prev.id, 'B');
  assert.strictEqual(r.next.id, 'D');
});

test('pickPrevNext: first element has no prev', () => {
  const r = U.pickPrevNext(NAV, '/p/8');
  assert.strictEqual(r.prev, null);
  assert.strictEqual(r.next.id, 'B');
});

test('pickPrevNext: last element has no next', () => {
  const r = U.pickPrevNext(NAV, '/p/11');
  assert.strictEqual(r.next, null);
  assert.strictEqual(r.prev.id, 'C');
});

test('pickPrevNext: falls back to active flag when href mismatch', () => {
  const r = U.pickPrevNext(NAV, '/p/unknown');
  assert.strictEqual(r.index, 2);
});

test('pickPrevNext: empty list returns null', () => {
  assert.strictEqual(U.pickPrevNext([], '/p/8'), null);
  assert.strictEqual(U.pickPrevNext(null, '/p/8'), null);
});

// -------------------------------------------------------- ongoing contests

test('pickOngoingAll: only started & not ended, soonest end first', () => {
  const now = 1000;
  const items = [
    { start: 0, end: 900 },     // ended
    { start: 500, end: 3000 },  // ongoing
    { start: 2000, end: 2500 }, // upcoming
    { start: 100, end: 1500 }   // ongoing, ends sooner
  ];
  const r = U.pickOngoingAll(items, now);
  assert.deepStrictEqual(r.map(i => i.end), [1500, 3000]);
});

test('pickOngoingAll: empty when nothing is live', () => {
  assert.deepStrictEqual(U.pickOngoingAll([{ start: 0, end: 5 }], 1000), []);
  assert.deepStrictEqual(U.pickOngoingAll(null, 1000), []);
});

test('isTopLevelPath: homepage / problems / contest / record', () => {
  assert.strictEqual(U.isTopLevelPath('/d/CS203/'), true);
  assert.strictEqual(U.isTopLevelPath('/d/CS203'), true);
  assert.strictEqual(U.isTopLevelPath('/d/CS203/p'), true);
  assert.strictEqual(U.isTopLevelPath('/d/CS203/p/'), true);
  assert.strictEqual(U.isTopLevelPath('/d/CS203/contest'), true);
  assert.strictEqual(U.isTopLevelPath('/d/CS203/record'), true);
  assert.strictEqual(U.isTopLevelPath('/d/CS203/record/'), true);
});

test('isTopLevelPath: sub-pages and other paths are excluded', () => {
  assert.strictEqual(U.isTopLevelPath('/d/CS203/p/123'), false);
  assert.strictEqual(U.isTopLevelPath('/d/CS203/contest/abc/scoreboard'), false);
  assert.strictEqual(U.isTopLevelPath('/d/CS203/record/123'), false);
  assert.strictEqual(U.isTopLevelPath('/d/CS203/home/settings/preference'), false);
  assert.strictEqual(U.isTopLevelPath('/'), false);
});

// ------------------------------------------------------ contest DOM parsing

function fakeEl(tag, opts) {
  opts = opts || {};
  return {
    tagName: tag,
    className: opts.className || '',
    textContent: opts.text || '',
    _href: opts.href || '',
    getAttribute: (k) => (k === 'href' ? opts.href || null : (k === 'data-timestamp' ? String(opts.ts) : null)),
    querySelector: (s) => (opts.q && opts.q[s]) || null,
    querySelectorAll: (s) => (opts.qa && opts.qa[s]) || []
  };
}

test('parseContestItems: reads name/url/start/duration', () => {
  const titleA = fakeEl('a', { text: 'Week 1', href: '/d/x/contest/aaa' });
  const timeA = fakeEl('span', { ts: 1000 });
  const durA = fakeEl('li', { q: { '.icon-schedule--fill': {} }, text: '2.5 小时' });
  const liA = fakeEl('li', { q: { '.contest__title a': titleA, '.contest__date .time[data-timestamp]': timeA }, qa: { '.supplementary.list li': [durA] } });
  const doc = { querySelectorAll: (s) => (s === 'li.contest__item' ? [liA] : []) };
  const r = U.parseContestItems(doc);
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].name, 'Week 1');
  assert.strictEqual(r[0].url, '/d/x/contest/aaa');
  assert.strictEqual(r[0].start, 1000);
  assert.strictEqual(r[0].end, 1000 + 2.5 * 3600);
});

function mkRow(statusClass, label, href) {
  return {
    querySelector: (s) => {
      if (s === 'td.col--problem-name') return {};
      if (s === 'td.col--status') return { className: statusClass };
      if (s === 'td.col--problem-name b') return { textContent: label };
      return null;
    },
    querySelectorAll: (s) => (s === 'td.col--problem-name a[href]'
      ? [{ getAttribute: () => href }] : [])
  };
}

// A problem-list table (has problem-name, no submit-by).
function mkProblemTable(rows) {
  return {
    querySelector: (s) => (s === 'td.col--problem-name' ? {} : null),
    querySelectorAll: (s) => (s === 'tbody tr' ? rows : [])
  };
}

// A submissions table (has problem-name AND submit-by).
function mkSubmitTable(rows) {
  return {
    querySelector: (s) => (s === 'td.col--problem-name' || s === 'td.col--submit-by' ? {} : null),
    querySelectorAll: (s) => (s === 'tbody tr' ? rows : [])
  };
}

function mkDoc(tables) {
  return { querySelectorAll: (s) => (s === 'table' ? tables : []) };
}

test('firstUnsolvedProblem: skips accepted rows, returns first pending', () => {
  const doc = mkDoc([mkProblemTable([
    mkRow('record-status--border pass', 'A', '/p/1?tid=t'),
    mkRow('record-status--border', 'B', '/p/2?tid=t')
  ])]);
  const r = U.firstUnsolvedProblem(doc);
  assert.strictEqual(r.label, 'B');
  assert.strictEqual(r.href, '/p/2?tid=t');
});

test('firstUnsolvedProblem: null when all accepted (pass class)', () => {
  const doc = mkDoc([mkProblemTable([
    mkRow('col--status record-status--border  pass', 'A', '/p/1?tid=t')
  ])]);
  assert.strictEqual(U.firstUnsolvedProblem(doc), null);
});

test('firstUnsolvedProblem: fail/progress rows are not treated as AC', () => {
  const doc = mkDoc([mkProblemTable([
    mkRow('record-status--border fail', 'A', '/p/A'),
    mkRow('record-status--border progress', 'B', '/p/B')
  ])]);
  assert.strictEqual(U.firstUnsolvedProblem(doc).label, 'A');
});

test('firstUnsolvedProblem: ignores the submissions table (only problem table)', () => {
  // Real contest pages render BOTH a problem table and a submissions table;
  // failed submissions for an accepted problem must NOT be picked up.
  const problemTable = mkProblemTable([
    mkRow('col--status record-status--border  pass', 'A', '/p/8?tid=t'),
    mkRow('col--status record-status--border  pass', 'B', '/p/9?tid=t')
  ]);
  const submitTable = mkSubmitTable([
    mkRow('record-status--border fail', '8', '/p/8?tid=t'),
    mkRow('record-status--border fail', '9', '/p/9?tid=t')
  ]);
  const doc = mkDoc([problemTable, submitTable]);
  assert.strictEqual(U.firstUnsolvedProblem(doc), null);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
