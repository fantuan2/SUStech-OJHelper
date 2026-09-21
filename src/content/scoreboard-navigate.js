(function () {
  'use strict';

  if (window.__OJH_LOCATE_ME__) return;
  window.__OJH_LOCATE_ME__ = true;

  var BTN_ID = 'ojh-locate-me';
  var FLASH_MS = 2000;

  function t(key, vars) {
    return window.OJHI18n ? window.OJHI18n.t(key, vars) : key;
  }

  function isScoreboardPage() {
    return /^\/d\/[^/]+\/contest\/[0-9a-fA-F]+\/scoreboard\/?$/.test(location.pathname);
  }

  function myUid() {
    try {
      if (window.UserContext && window.UserContext._id != null) return String(window.UserContext._id);
    } catch (e) { /* ignore */ }
    var link = document.querySelector('.nav__list--secondary a[href*="/user/"]');
    if (link) {
      var m = link.getAttribute('href').match(/\/user\/(\d+)/);
      if (m) return m[1];
    }
    return null;
  }

  // Pure helper (also unit-tested): find the row whose user link points to uid.
  function findRow(rows, uid) {
    if (!uid) return null;
    var needle = '/user/' + uid;
    for (var i = 0; i < rows.length; i++) {
      var links = rows[i].querySelectorAll('td.col--user a[href]');
      for (var j = 0; j < links.length; j++) {
        if (links[j].getAttribute('href').indexOf(needle) >= 0) return rows[i];
      }
    }
    return null;
  }

  function toast(text) {
    var el = document.getElementById('ojh-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ojh-toast';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('ojh-show');
    if (el.__ojhTimer) clearTimeout(el.__ojhTimer);
    el.__ojhTimer = setTimeout(function () { el.classList.remove('ojh-show'); }, 2800);
  }

  function locate() {
    var uid = myUid();
    var rows = document.querySelectorAll('table tbody tr');
    var row = findRow(Array.prototype.slice.call(rows), uid);
    if (!row) {
      toast(t('locateMe.notFound'));
      return;
    }
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.remove('ojh-locate-flash');
    // force reflow so the animation restarts on repeated clicks
    void row.offsetWidth;
    row.classList.add('ojh-locate-flash');
    setTimeout(function () { row.classList.remove('ojh-locate-flash'); }, FLASH_MS);
  }

  function buildButton() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = BTN_ID;
    btn.className = 'ojh-bookmark';
    btn.title = t('locateMe.btn');
    btn.setAttribute('aria-label', t('locateMe.btn'));
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
      '<path d="M6 3h12a1 1 0 0 1 1 1v16.2a.7.7 0 0 1-1.1.57L12 17.2l-5.9 3.57A.7.7 0 0 1 5 20.2V4a1 1 0 0 1 1-1z"/>' +
      '</svg>';
    btn.addEventListener('click', locate);
    return btn;
  }

  var btn = null;

  function ensureButton() {
    if (!isScoreboardPage()) {
      if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
      btn = null;
      return;
    }
    if (btn && document.contains(btn)) return;
    var old = document.getElementById(BTN_ID);
    if (old) old.parentNode.removeChild(old);
    btn = buildButton();
    document.body.appendChild(btn);
  }

  function init() {
    if (window.OJHDetect && !window.OJHDetect.isHydro()) return;
    ensureButton();
    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(document.documentElement, { subtree: true, childList: true });
    setInterval(ensureButton, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // expose for tests
  window.__ojhLocateTest = { findRow: findRow, myUid: myUid };
})();
