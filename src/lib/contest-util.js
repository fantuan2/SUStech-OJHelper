(function (g) {
  'use strict';

  if (g.OJHContestUtil) return;

  // Parse a Hydro duration label like "332.5 小时" / "332.5 hour(s)" into seconds.
  function parseDuration(text) {
    var m = String(text || '').replace(/,/g, '').match(/([\d.]+)\s*(小时|hour|hours|hr|hrs)/i);
    if (!m) return null;
    var h = parseFloat(m[1]);
    if (isNaN(h) || h < 0) return null;
    return Math.round(h * 3600);
  }

  // Among contests that have not ended yet, pick the one that ends soonest.
  function pickNearest(items, nowSec) {
    var now = nowSec == null ? Date.now() / 1000 : nowSec;
    var alive = (items || []).filter(function (it) { return it && it.end > now; });
    if (!alive.length) return null;
    alive.sort(function (a, b) { return a.end - b.end; });
    return alive[0];
  }

  // Ongoing contests (started, not ended), ending soonest first.
  function pickOngoingAll(items, nowSec) {
    var now = nowSec == null ? Date.now() / 1000 : nowSec;
    var alive = (items || []).filter(function (it) {
      return it && it.start <= now && it.end > now;
    });
    alive.sort(function (a, b) { return a.end - b.end; });
    return alive;
  }

  // Parse contest items from a homepage / contest-list document. Each item:
  // { name, url, start, dur, end }.
  function parseContestItems(doc) {
    if (!doc || !doc.querySelectorAll) return [];
    var nodes = doc.querySelectorAll('li.contest__item');
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var li = nodes[i];
      var a = li.querySelector('.contest__title a');
      var tsEl = li.querySelector('.contest__date .time[data-timestamp]');
      if (!a || !tsEl) continue;
      var start = parseInt(tsEl.getAttribute('data-timestamp'), 10);
      if (isNaN(start)) continue;

      var durLi = null;
      var sup = li.querySelectorAll('.supplementary.list li');
      for (var j = 0; j < sup.length; j++) {
        if (sup[j].querySelector('.icon-schedule--fill')) { durLi = sup[j]; break; }
      }
      var dur = durLi ? parseDuration(durLi.textContent) : null;
      if (dur == null) continue;

      out.push({
        name: a.textContent.trim(),
        url: a.getAttribute('href') || a.href || '',
        start: start,
        dur: dur,
        end: start + dur
      });
    }
    return out;
  }

  // Pick the contest problem-list table, ignoring the submissions table that
  // also renders a `td.col--problem-name` column (it has `col--submit-by`).
  function pickProblemTable(doc) {
    if (!doc || !doc.querySelectorAll) return null;
    var tables = doc.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      if (!t.querySelector) continue;
      if (t.querySelector('td.col--problem-name') && !t.querySelector('td.col--submit-by')) {
        return t;
      }
    }
    return null;
  }

  // From a contest problem-list document, return the first problem the user
  // has not accepted yet: { href, label }. Null when all are accepted.
  function firstUnsolvedProblem(doc) {
    if (!doc || !doc.querySelectorAll) return null;
    var table = pickProblemTable(doc);
    if (!table) return null;
    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!row.querySelector || !row.querySelector('td.col--problem-name')) continue;

      var link = null;
      var links = row.querySelectorAll('td.col--problem-name a[href]');
      for (var j = 0; j < links.length; j++) {
        var href = links[j].getAttribute('href') || '';
        if (href.indexOf('/submit') >= 0) continue;
        link = links[j];
        break;
      }
      if (!link) continue;

      // Hydro marks accepted rows with the "pass" status class (see
      // STATUS_CODES); "fail"/"progress"/"pending"/"ignored" are not accepted.
      var status = row.querySelector('td.col--status');
      if (status && /\b(pass|accepted)\b/.test(status.className || '')) continue;

      var b = row.querySelector('td.col--problem-name b');
      return {
        href: link.getAttribute('href') || link.href || '',
        label: b ? b.textContent.trim() : ''
      };
    }
    return null;
  }

  function statusOf(item, nowSec) {
    var now = nowSec == null ? Date.now() / 1000 : nowSec;
    return item && item.start <= now ? 'live' : 'upcoming';
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Absolute local time: "2026-9-29 10:00"
  function fmtAbs(tsSec) {
    var d = new Date(tsSec * 1000);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // Relative countdown: "13天 6时 5分 3秒" / "13d 6h 5m 3s"
  function fmtRel(ms) {
    var sec = Math.max(0, Math.floor(ms / 1000));
    var d = Math.floor(sec / 86400); sec -= d * 86400;
    var h = Math.floor(sec / 3600); sec -= h * 3600;
    var m = Math.floor(sec / 60);
    var s = sec - m * 60;
    var parts = [];
    if (d > 0) parts.push(d + t('unit.day'));
    parts.push(h + t('unit.hour'), m + t('unit.minute'), s + t('unit.second'));
    return parts.join(' ');
  }

  function t(key) {
    return g.OJHI18n ? g.OJHI18n.t(key) : key;
  }

  // ------------------------------------------------------- scoreboard cells

  // Header cell text like "A106/274" -> { id, accepted, submitted }.
  function parseScoreboardHeader(text) {
    var m = String(text || '').replace(/\s+/g, '').match(/^([A-Za-z])(\d+)\/(\d+)$/);
    if (!m) return null;
    return { id: m[1], accepted: parseInt(m[2], 10), submitted: parseInt(m[3], 10) };
  }

  // Problem cell text:
  //   "0:44"          -> accepted on 1st submission
  //   "+2 4:41"       -> accepted after 2 failures (3 submissions)
  //   "-6"            -> 6 failed submissions, never accepted
  //   ""              -> no submissions
  function parseScoreboardCell(text) {
    var s = String(text || '').replace(/\s+/g, ' ').trim();
    if (!s) return { type: 'none' };
    var m = s.match(/^-(\d+)$/);
    if (m) return { type: 'fail', attempts: parseInt(m[1], 10) };
    m = s.match(/^(?:\+(\d+)\s+)?(\d{1,3}:\d{2})$/);
    if (m) {
      var fails = m[1] ? parseInt(m[1], 10) : 0;
      return { type: 'ac', fails: fails, attempts: fails + 1, timeText: m[2] };
    }
    return null;
  }

  // Solved column text like "6 17:23" -> { solved, timeText }.
  function parseScoreboardSolved(text) {
    var s = String(text || '').replace(/\s+/g, ' ').trim();
    var m = s.match(/^(\d+)\s+(\d{1,3}:\d{2})$/);
    if (!m) return null;
    return { solved: parseInt(m[1], 10), timeText: m[2] };
  }

  // ------------------------------------------------------------ top-level

  // Top-level pages (homepage / problem set / contest list / record list).
  function isTopLevelPath(pathname) {
    var p = String(pathname || '');
    return /^\/d\/[^/]+\/?$/.test(p) ||
      /^\/d\/[^/]+\/p\/?$/.test(p) ||
      /^\/d\/[^/]+\/contest\/?$/.test(p) ||
      /^\/d\/[^/]+\/record\/?$/.test(p);
  }

  // ------------------------------------------------------------ navigation

  // list: [{href, id, ac, active}] in display order, currentHref locates the
  // entry (falls back to the `active` flag only when no href matches).
  // Returns {index, prev, next}.
  function pickPrevNext(list, currentHref) {
    if (!list || !list.length) return null;
    var idx = -1;
    var activeIdx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].href === currentHref) { idx = i; break; }
      if (activeIdx < 0 && list[i].active) activeIdx = i;
    }
    if (idx < 0) idx = activeIdx;
    if (idx < 0) return null;
    return {
      index: idx,
      prev: idx > 0 ? list[idx - 1] : null,
      next: idx < list.length - 1 ? list[idx + 1] : null
    };
  }

  g.OJHContestUtil = {
    parseDuration: parseDuration,
    pickNearest: pickNearest,
    pickOngoingAll: pickOngoingAll,
    parseContestItems: parseContestItems,
    firstUnsolvedProblem: firstUnsolvedProblem,
    statusOf: statusOf,
    fmtAbs: fmtAbs,
    fmtRel: fmtRel,
    parseScoreboardHeader: parseScoreboardHeader,
    parseScoreboardCell: parseScoreboardCell,
    parseScoreboardSolved: parseScoreboardSolved,
    isTopLevelPath: isTopLevelPath,
    pickPrevNext: pickPrevNext
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
