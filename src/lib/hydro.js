(function (g) {
  'use strict';

  if (g.OJHDetect) return;

  // Decide whether a page is a Hydro OJ instance. Prefer the framework's own
  // global object, then fall back to stable DOM fingerprints shared by all
  // Hydro deployments (they use the same theme markup).
  function isHydro(win, doc) {
    win = win || (typeof window !== 'undefined' ? window : null);
    doc = doc || (win && win.document) || (typeof document !== 'undefined' ? document : null);

    try {
      if (win && win.Hydro) {
        if (win.Hydro.api || win.Hydro.utils || win.Hydro.version || win.Hydro.model) return true;
      }
    } catch (e) { /* ignore */ }

    if (!doc || !doc.querySelector) return false;

    try {
      var gen = doc.querySelector('meta[name="generator"]');
      if (gen) {
        var c = (gen.getAttribute('content') || '').toLowerCase();
        if (c.indexOf('hydro') >= 0) return true;
      }
      if (doc.querySelector('.nav__list--main')) return true;
      if (doc.querySelector('.section__header .section__title')) return true;
      var body = doc.body;
      if (body && body.className && /(^|\s)mode--/.test(body.className)) return true;
    } catch (e) { /* ignore */ }

    return false;
  }

  // Hydro's bundle may attach after document_idle; poll briefly.
  function waitForHydro(cb, timeoutMs, win, doc) {
    var deadline = Date.now() + (timeoutMs || 2500);
    (function poll() {
      if (isHydro(win, doc)) { cb(true); return; }
      if (Date.now() >= deadline) { cb(false); return; }
      setTimeout(poll, 200);
    })();
  }

  g.OJHDetect = {
    isHydro: isHydro,
    waitForHydro: waitForHydro
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
