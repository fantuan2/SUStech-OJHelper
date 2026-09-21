(function () {
  'use strict';

  if (window.__OJH_PROBLEM_NAV__) return;
  window.__OJH_PROBLEM_NAV__ = true;

  function t(key) {
    return window.OJHI18n ? window.OJHI18n.t(key) : key;
  }

  function isContestProblemPage() {
    return /^\/d\/[^/]+\/p\/[^/]+/.test(location.pathname) && /[?&]tid=/.test(location.search);
  }

  // Parse Hydro's built-in A–F quick-nav strip in the page header.
  // Each <a> has: href, .id letter, `active` for the current problem,
  // first class `pass` when this user accepted it.
  function parseNavList() {
    var strip = document.querySelector('.section__tools.contest-problems');
    if (!strip) return [];
    var out = [];
    var links = strip.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var idEl = a.querySelector('.id');
      out.push({
        id: idEl ? idEl.textContent.trim() : '?',
        href: a.getAttribute('href'),
        ac: /\bpass\b/.test(a.className),
        active: /\bactive\b/.test(a.className)
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

  function buildTag(letter, label, href, align) {
    var tag = el('a', 'ojh-pn ojh-pn-' + align);
    tag.href = href;
    tag.textContent = (align === 'prev' ? '‹ ' : '') + label + ' ' + letter + (align === 'next' ? ' ›' : '');
    return tag;
  }

  function removeBar() {
    var bar = document.getElementById('ojh-pn-bar');
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function ensure() {
    var existing = document.getElementById('ojh-pn-bar');
    if (!isContestProblemPage()) {
      removeBar();
      return;
    }
    var list = parseNavList();
    if (!list.length) return;
    var pn = window.OJHContestUtil.pickPrevNext(list, location.pathname + location.search);
    if (!pn) {
      removeBar();
      return;
    }

    var ul = document.querySelector('ul.problem__tags');
    if (!ul) return;

    // Rebuild only when targets change.
    var sig = JSON.stringify([pn.prev ? pn.prev.href : null, pn.next ? pn.next.href : null]);
    if (existing && document.contains(existing) && existing.__ojhPnSig === sig) return;

    removeBar();
    if (!pn.prev && !pn.next) return;

    var bar = el('div', 'ojh-pn-bar');
    bar.id = 'ojh-pn-bar';
    bar.__ojhPnSig = sig;
    if (pn.prev) bar.appendChild(buildTag(pn.prev.id, t('prevProblem'), pn.prev.href, 'prev'));
    else bar.appendChild(el('span', 'ojh-pn-spacer'));
    if (pn.next) bar.appendChild(buildTag(pn.next.id, t('nextProblem'), pn.next.href, 'next'));
    else bar.appendChild(el('span', 'ojh-pn-spacer'));

    // Own row right below the Type/time/memory tags line.
    ul.parentNode.insertBefore(bar, ul.nextSibling);
  }

  function init() {
    if (window.OJHDetect && !window.OJHDetect.isHydro()) return;
    ensure();
    var mo = new MutationObserver(function () { ensure(); });
    mo.observe(document.documentElement, { subtree: true, childList: true });
    setInterval(ensure, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__ojhNavTest = { parseNavList: parseNavList, ensure: ensure };
})();
