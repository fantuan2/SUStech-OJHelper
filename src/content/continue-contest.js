(function () {
  'use strict';

  if (window.__OJH_CONTINUE__) return;
  window.__OJH_CONTINUE__ = true;

  var BTN_ID = 'ojh-continue-btn';
  var CACHE_TTL = 15000;
  var settings = null;
  var cache = null;   // { href, label, name, at }
  var inflight = false;

  function t(key) {
    return window.OJHI18n ? window.OJHI18n.t(key) : key;
  }

  // Top-level pages where the button should appear: homepage, problem set,
  // contest list, record list.
  function isTopLevelPage() {
    return window.OJHContestUtil.isTopLevelPath(location.pathname);
  }

  function originBase() {
    var m = location.pathname.match(/^\/d\/[^/]+/);
    return location.origin + (m ? m[0] : '');
  }

  function fetchDoc(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (html) {
        if (!html) return null;
        return new DOMParser().parseFromString(html, 'text/html');
      })
      .catch(function () { return null; });
  }

  // Walk ongoing contests from the soonest-ending one; return the first
  // contest's first non-AC problem. Only when no ongoing contest has an
  // unsolved problem do we return null (the button then greys out).
  function computeTarget() {
    var base = originBase();
    return fetchDoc(base + '/contest').then(function (contestDoc) {
      if (!contestDoc) return null;
      var now = Date.now() / 1000;
      var ongoing = window.OJHContestUtil.pickOngoingAll(
        window.OJHContestUtil.parseContestItems(contestDoc), now);
      if (!ongoing.length) return null;

      var limit = Math.min(ongoing.length, 5);

      function step(i) {
        if (i >= limit) return Promise.resolve(null);
        var contest = ongoing[i];
        var tid = contest.url.replace(/\/$/, '').split('/').pop();
        var problemsUrl = base + '/contest/' + tid + '/problems';
        return fetchDoc(problemsUrl).then(function (probDoc) {
          var problem = probDoc ? window.OJHContestUtil.firstUnsolvedProblem(probDoc) : null;
          if (problem) {
            return { href: problem.href, label: problem.label, name: contest.name };
          }
          return step(i + 1);
        });
      }

      return step(0);
    });
  }

  // ------------------------------------------------------- top-level button

  var button = null;

  function removeButton() {
    if (button && button.parentNode) button.parentNode.removeChild(button);
    button = null;
  }

  // Keep the button as a top-level nav item, sibling to Home / Problems / etc.
  function buildButton(target) {
    var li = document.createElement('li');
    li.className = 'nav__list-item';
    var a = document.createElement('a');
    a.id = BTN_ID;
    a.className = 'nav__item ojh-continue';
    if (target && target.href) {
      a.href = target.href;
      a.textContent = '▶ ' + t('continue.btn');
      var parts = [];
      if (target.name) parts.push(target.name);
      if (target.label) parts.push(target.label);
      a.title = parts.length ? parts.join(' · ') : t('continue.btn');
    } else {
      a.href = 'javascript:;';
      a.className += ' ojh-continue--empty';
      a.textContent = t('continue.btn');
      a.title = t('continue.none');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        toast(t('continue.none'));
      });
    }
    li.appendChild(a);
    return li;
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

  function currentHref() {
    return cache && cache.href ? cache.href : '';
  }

  function mount(target) {
    var nav = document.querySelector('.nav__list--main');
    if (!nav) return;
    if (button && document.contains(button) && button.__ojhHref === currentHref()) return;
    removeButton();
    button = buildButton(target);
    button.__ojhHref = currentHref();
    nav.appendChild(button);
  }

  function refresh() {
    if (inflight) return;
    inflight = true;
    computeTarget().then(function (target) {
      inflight = false;
      cache = target
        ? { href: target.href, label: target.label, name: target.name, at: Date.now() }
        : { href: '', label: '', name: '', at: Date.now() };
      mount(target);
    });
  }

  function ensureButton() {
    if (!isTopLevelPage() || !settings || !settings.common || !settings.common.showContinueButton) {
      removeButton();
      return;
    }
    if (!document.querySelector('.nav__list--main')) return;

    // Mount immediately from cache (so it stays visible), refresh in background.
    if (!cache) {
      refresh();
      return;
    }
    mount(cache.href ? { href: cache.href, label: cache.label, name: cache.name } : null);
    if (Date.now() - cache.at > CACHE_TTL) refresh();
  }

  function init() {
    if (window.OJHDetect && !window.OJHDetect.isHydro()) return;
    if (window.OJHSettings) {
      window.OJHSettings.get(function (s) {
        settings = s;
        ensureButton();
      });
      try {
        chrome.storage.onChanged.addListener(function (changes, area) {
          if (area !== 'sync') return;
          window.OJHSettings.get(function (s) {
            settings = s;
            ensureButton();
          });
        });
      } catch (e) { /* ignore */ }
    }

    var mo = new MutationObserver(function () { ensureButton(); });
    mo.observe(document.documentElement, { subtree: true, childList: true });
    setInterval(ensureButton, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__ojhContinueTest = {
    buildButton: buildButton,
    currentHref: currentHref,
    isTopLevelPage: isTopLevelPage
  };
})();
