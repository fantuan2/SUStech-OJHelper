(function () {
  'use strict';

  if (window.__OJH_COUNTDOWN__) return;
  window.__OJH_COUNTDOWN__ = true;

  var BANNER_ID = 'ojh-countdown-banner';
  var settings = null;
  var banner = null;
  var current = null;   // { url, end }
  var remainingEl = null;

  function t(key, vars) {
    return window.OJHI18n ? window.OJHI18n.t(key, vars) : key;
  }

  function isTargetPage() {
    var p = location.pathname;
    return /^\/d\/[^/]+\/?$/.test(p) || /^\/d\/[^/]+\/contest\/?$/.test(p);
  }

  // Parse contest items shared by the homepage and the contest list page.
  function parseItems() {
    var nodes = document.querySelectorAll('li.contest__item');
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
      var dur = durLi ? OJHContestUtil.parseDuration(durLi.textContent) : null;
      if (dur == null) continue;

      out.push({
        name: a.textContent.trim(),
        url: a.href,
        start: start,
        dur: dur,
        end: start + dur
      });
    }
    return out;
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function anchorColumn() {
    return document.querySelector('.main .row > .columns') || document.querySelector('.main');
  }

  function removeBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
    current = null;
    remainingEl = null;
  }

  function fmtRemaining(item) {
    return OJHContestUtil.fmtRel(item.end * 1000 - Date.now());
  }

  function buildBanner(item) {
    removeBanner();
    var col = anchorColumn();
    if (!col) return;

    var status = OJHContestUtil.statusOf(item);

    banner = el('div', 'ojh-countdown');
    banner.id = BANNER_ID;
    banner.appendChild(el('span', 'ojh-cd-title', t('countdownTitle')));

    var badge = el('span', 'ojh-cd-badge ojh-cd-' + status, t('status.' + status));
    banner.appendChild(badge);

    var name = document.createElement('a');
    name.className = 'ojh-cd-name';
    name.textContent = item.name;
    name.href = item.url;
    name.target = '_self';
    banner.appendChild(name);

    banner.appendChild(el('span', 'ojh-cd-item', t('cd.start') + ': ' + OJHContestUtil.fmtAbs(item.start)));
    banner.appendChild(el('span', 'ojh-cd-item', t('cd.end') + ': ' + OJHContestUtil.fmtAbs(item.end)));

    remainingEl = el('span', 'ojh-cd-remaining', t('cd.remaining') + ': ' + fmtRemaining(item));
    banner.appendChild(remainingEl);

    col.insertBefore(banner, col.firstChild);
  }

  function render() {
    if (!isTargetPage() || !settings || !settings.common || !settings.common.showContestCountdown) {
      removeBanner();
      return;
    }
    var item = OJHContestUtil.pickNearest(parseItems());
    if (!item) {
      removeBanner();
      return;
    }
    if (banner && document.contains(banner) && current &&
        current.url === item.url && current.end === item.end) {
      if (remainingEl) remainingEl.textContent = t('cd.remaining') + ': ' + fmtRemaining(item);
      return;
    }
    current = { url: item.url, end: item.end };
    buildBanner(item);
  }

  function init() {
    if (window.OJHDetect && !window.OJHDetect.isHydro()) return;
    OJHSettings.get(function (s) {
      settings = s;
      render();
    });

    try {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'sync') return;
        OJHSettings.get(function (s) {
          settings = s;
          render();
        });
      });
    } catch (e) { /* ignore */ }

    setInterval(render, 2000);
    setInterval(function () {
      if (banner && document.contains(banner) && current && remainingEl) {
        remainingEl.textContent = t('cd.remaining') + ': ' + fmtRemaining({ end: current.end });
      }
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
