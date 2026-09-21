(function () {
  'use strict';

  if (window.__OJH_ISOLATED__) return;
  window.__OJH_ISOLATED__ = true;

  var CHANNEL = '__OJHELPER__';

  var settings = null;
  var pending = {};
  var seq = 0;
  var state = { lang: '', changes: [], supported: false };
  var button = null;
  var btnWrap = null;
  var buttonKind = null;
  var ticking = false;
  var tickTimer = null;

  function t(key, vars) {
    return window.OJHI18n ? window.OJHI18n.t(key, vars) : key;
  }

  function request(type, payload, timeoutMs) {
    return new Promise(function (resolve) {
      var id = 'r' + (++seq) + '_' + Math.random().toString(36).slice(2);
      var timer = setTimeout(function () {
        delete pending[id];
        resolve(null);
      }, timeoutMs || 1500);
      pending[id] = function (msg) {
        clearTimeout(timer);
        delete pending[id];
        resolve(msg);
      };
      var msg = { ch: CHANNEL, dir: 'to-main', type: type, id: id };
      if (payload) for (var k in payload) msg[k] = payload[k];
      try {
        window.postMessage(msg, location.origin);
      } catch (e) {
        window.postMessage(msg, '*');
      }
    });
  }

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || d.ch !== CHANNEL || d.dir !== 'to-iso') return;
    if (d.id && pending[d.id]) pending[d.id](d);
  });

  function preferenceUrl() {
    var m = location.pathname.match(/^\/d\/([^/]+)\//);
    return location.origin + (m ? '/d/' + m[1] + '/home/settings/preference' : '/');
  }

  function readTextareaLang() {
    var named = document.querySelector('select[name="lang"]');
    if (named && named.value) return named.value;
    var visible = document.querySelector('#codelang-selector select');
    if (visible) return visible.value;
    return '';
  }

  // Detect the active editing surface: Monaco scratchpad or submit-page textarea.
  function getSurface() {
    if (document.body && document.body.classList.contains('mode--scratchpad')) {
      var toolbar = document.querySelector('.scratchpad__toolbar');
      if (toolbar) return { kind: 'monaco', mount: toolbar };
    }
    var ta = document.querySelector('textarea[name="code"]');
    if (ta && /\/p\/[^/]+\/submit/.test(location.pathname)) {
      var label = ta.closest('label');
      var ref = label || ta;
      var mount = (ref && ref.parentNode) ? ref.parentNode : ta.parentNode;
      if (mount) return { kind: 'textarea', el: ta, mount: mount, ref: ref };
    }
    return null;
  }

  function removeButton() {
    if (btnWrap && btnWrap.parentNode) btnWrap.parentNode.removeChild(btnWrap);
    btnWrap = null;
    button = null;
    buttonKind = null;
  }

  function ensureButton() {
    var s = getSurface();
    if (!s) {
      if (btnWrap && !document.contains(btnWrap)) removeButton();
      return;
    }
    if (btnWrap && buttonKind === s.kind && document.contains(btnWrap)) return;

    removeButton();

    button = document.createElement('button');
    button.type = 'button';
    button.className = 'ojh-btn';
    button.addEventListener('click', onClick);

    btnWrap = document.createElement('div');
    btnWrap.className = 'ojh-btn-wrap';
    btnWrap.appendChild(button);

    if (s.kind === 'monaco') {
      var submit = s.mount.querySelector('.scratchpad__toolbar__submit');
      if (submit && submit.parentNode === s.mount) s.mount.insertBefore(btnWrap, submit);
      else s.mount.appendChild(btnWrap);
    } else {
      btnWrap.classList.add('ojh-submit-bar');
      var settingsLink = document.createElement('a');
      settingsLink.className = 'ojh-btn ojh-btn-secondary';
      settingsLink.textContent = t('changeSettings');
      settingsLink.href = preferenceUrl();
      settingsLink.target = '_blank';
      settingsLink.rel = 'noopener';
      btnWrap.appendChild(settingsLink);
      if (s.ref && s.ref.parentNode) s.ref.parentNode.insertBefore(btnWrap, s.ref);
      else s.mount.appendChild(btnWrap);
    }

    buttonKind = s.kind;
    render();
    tick();
  }

  function render() {
    if (!button) return;
    button.classList.remove('ojh-active', 'ojh-ok', 'ojh-na');
    if (!state.supported) {
      button.textContent = t('normalizeBtn');
      button.classList.add('ojh-na');
      button.title = t('unsupportedTitle');
      return;
    }
    if (state.changes.length) {
      button.textContent = t('normalizeBtn') + ' (' + state.changes.length + ')';
      button.classList.add('ojh-active');
      button.title = state.changes.map(function (c) { return c.label; }).join('；');
    } else {
      button.textContent = t('normalizedBtn');
      button.classList.add('ojh-ok');
      button.title = t('alreadyNormalized');
    }
  }

  function readCode() {
    var s = getSurface();
    if (!s) return Promise.resolve(null);
    if (s.kind === 'monaco') return request('get', {});
    return Promise.resolve({ code: s.el.value, lang: readTextareaLang(), uri: '' });
  }

  function writeCode(code) {
    var s = getSurface();
    if (!s) return Promise.resolve(false);
    if (s.kind === 'monaco') {
      return request('set', { code: code }).then(function (r) { return !!(r && r.ok); });
    }
    s.el.value = code;
    try {
      s.el.dispatchEvent(new Event('input', { bubbles: true }));
      s.el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) { /* ignore */ }
    return Promise.resolve(true);
  }

  function tick() {
    if (!button || ticking) return;
    ticking = true;
    readCode().then(function (msg) {
      ticking = false;
      if (!msg) {
        state = { lang: '', changes: [], supported: false };
        render();
        return;
      }
      var res = OJHCore.normalize(msg.code, msg.lang, OJHSettings.optionsFor(msg.lang, settings));
      state.lang = msg.lang;
      state.supported = res.supported;
      state.changes = res.changes || [];
      render();
    });
  }

  function scheduleTick(delay) {
    if (tickTimer) clearTimeout(tickTimer);
    tickTimer = setTimeout(tick, delay || 250);
  }

  function onClick() {
    if (ticking) return;
    readCode().then(function (msg) {
      if (!msg) { toast(t('noEditorContent')); return; }
      var res = OJHCore.normalize(msg.code, msg.lang, OJHSettings.optionsFor(msg.lang, settings));
      if (!res.supported) { toast(t('unsupportedToast', { lang: msg.lang || '?' })); return; }
      if (!res.changes.length) { toast(t('alreadyNormalized')); return; }
      return writeCode(res.code).then(function (ok) {
        if (ok) {
          toast(t('normalizedToast', { list: res.changes.map(function (c) { return c.label; }).join('、') }));
          state.changes = [];
          render();
        } else {
          toast(t('writeFailed'));
        }
      });
    });
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
    el.__ojhTimer = setTimeout(function () {
      el.classList.remove('ojh-show');
    }, 2800);
  }

  function init() {
    if (window.OJHDetect && !window.OJHDetect.isHydro()) return;
    OJHSettings.get(function (s) {
      settings = s;
      ensureButton();
    });

    try {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'sync') return;
        OJHSettings.get(function (s) {
          settings = s;
          tick();
          render();
        });
      });
    } catch (e) { /* ignore */ }

    var mo = new MutationObserver(function () {
      ensureButton();
    });
    mo.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class']
    });

    document.addEventListener('input', function (e) {
      if (e.target && e.target.tagName === 'TEXTAREA' && e.target.name === 'code') {
        scheduleTick(300);
      }
    }, true);

    document.addEventListener('change', function (e) {
      if (e.target && e.target.tagName === 'SELECT') scheduleTick(300);
    }, true);

    setInterval(function () {
      ensureButton();
      if (button) tick();
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
