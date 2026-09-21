'use strict';

(function () {
  var COOLDOWN_SEC = 5;

  function t(key, vars) {
    return window.OJHI18n ? window.OJHI18n.t(key, vars) : key;
  }

  function applyI18n() {
    document.documentElement.lang = OJHI18n.lang();
    document.title = t('disclaimerTitle');
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
  }

  function queryOrigin() {
    var m = location.search.match(/[?&]origin=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function main() {
    applyI18n();

    var origin = OJHScripts.normalizeOrigin(queryOrigin());
    var originEl = document.getElementById('origin');
    var ack = document.getElementById('ack');
    var enableBtn = document.getElementById('enable');
    var cancelBtn = document.getElementById('cancel');
    var hint = document.getElementById('hint');

    if (!origin) {
      originEl.textContent = '?';
      hint.textContent = t('disclaimerNoOrigin');
      enableBtn.disabled = true;
      return;
    }
    originEl.textContent = origin;

    var remaining = COOLDOWN_SEC;
    var ready = false;

    function refresh() {
      var ok = ready && ack.checked;
      enableBtn.disabled = !ok;
      if (ok) {
        enableBtn.textContent = t('disclaimerEnable');
        hint.textContent = '';
      } else if (!ready) {
        enableBtn.textContent = t('disclaimerEnable');
        hint.textContent = t('disclaimerWait', { sec: remaining });
      } else {
        enableBtn.textContent = t('disclaimerEnable');
        hint.textContent = '';
      }
    }

    function tick() {
      remaining -= 1;
      if (remaining <= 0) {
        ready = true;
        refresh();
        return;
      }
      refresh();
      setTimeout(tick, 1000);
    }

    hint.textContent = t('disclaimerWait', { sec: remaining });
    setTimeout(tick, 1000);
    ack.addEventListener('change', refresh);
    refresh();

    cancelBtn.addEventListener('click', function () { window.close(); });

    enableBtn.addEventListener('click', function () {
      if (enableBtn.disabled) return;
      chrome.permissions.request({ origins: [origin + '/*'] }, function (granted) {
        void chrome.runtime.lastError;
        if (!granted) {
          hint.textContent = t('disclaimerGrantFail');
          hint.className = 'hint';
          return;
        }
        chrome.runtime.sendMessage({ type: 'ojh-site-enabled', origin: origin }, function () {
          void chrome.runtime.lastError;
          hint.textContent = t('disclaimerEnabled') + ' ' + t('disclaimerReloadHint');
          hint.className = 'hint ok';
          enableBtn.disabled = true;
          enableBtn.textContent = t('disclaimerEnabled');
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', main);
})();
