'use strict';

(function () {
  function t(key, vars) {
    return window.OJHI18n ? window.OJHI18n.t(key, vars) : key;
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function applyI18n() {
    document.documentElement.lang = OJHI18n.lang();
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
  }

  // Runs in the page (MAIN world via activeTab) to detect Hydro fingerprints.
  function detectInPage() {
    try {
      if (window.Hydro && (window.Hydro.api || window.Hydro.utils || window.Hydro.model || window.Hydro.version)) return true;
    } catch (e) { /* ignore */ }
    try {
      var gen = document.querySelector('meta[name="generator"]');
      if (gen && (gen.getAttribute('content') || '').toLowerCase().indexOf('hydro') >= 0) return true;
      if (document.querySelector('.nav__list--main')) return true;
      if (document.querySelector('.section__header .section__title')) return true;
      if (document.body && /(^|\s)mode--/.test(document.body.className)) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function detectHydro(tabId) {
    return new Promise(function (resolve) {
      try {
        chrome.scripting.executeScript(
          { target: { tabId: tabId }, func: detectInPage, world: 'MAIN' },
          function (results) {
            void chrome.runtime.lastError;
            var ok = !!(results && results[0] && results[0].result);
            resolve(ok);
          }
        );
      } catch (e) {
        resolve(false);
      }
    });
  }

  function getActiveTab() {
    return new Promise(function (resolve) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        resolve(tabs && tabs[0] ? tabs[0] : null);
      });
    });
  }

  function permissionsContains(origin) {
    return new Promise(function (resolve) {
      chrome.permissions.contains({ origins: [origin + '/*'] }, function (yes) {
        void chrome.runtime.lastError;
        resolve(!!yes);
      });
    });
  }

  function renderMessage(body, key) {
    body.innerHTML = '';
    body.appendChild(el('p', 'msg', t(key)));
  }

  function addButton(body, labelKey, className, onClick) {
    var btn = el('button', className, t(labelKey));
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    body.appendChild(btn);
    return btn;
  }

  function renderEnabled(body, origin, isDefault) {
    body.appendChild(el('span', 'origin', origin));
    var status = el('span', 'status on', isDefault ? t('defaultSite') : t('popupEnabled'));
    body.appendChild(status);
    var actions = el('div', 'actions');
    body.appendChild(actions);

    if (!isDefault) {
      var disable = el('button', 'danger', t('popupDisableSite'));
      disable.type = 'button';
      disable.addEventListener('click', function () {
        chrome.permissions.remove({ origins: [origin + '/*'] }, function () {
          void chrome.runtime.lastError;
          window.close();
        });
      });
      actions.appendChild(disable);
    }
    var opts = el('button', 'primary', t('popupOpenOptions'));
    opts.type = 'button';
    opts.addEventListener('click', function () { chrome.runtime.openOptionsPage(); });
    actions.appendChild(opts);
  }

  function renderEnable(body, origin) {
    body.appendChild(el('span', 'origin', origin));
    body.appendChild(el('div', 'beta', t('popupBeta')));
    var actions = el('div', 'actions');
    body.appendChild(actions);

    var enable = el('button', 'primary', t('popupEnableSite'));
    enable.type = 'button';
    enable.addEventListener('click', function () {
      var url = chrome.runtime.getURL('src/disclaimer/disclaimer.html') +
        '?origin=' + encodeURIComponent(origin);
      chrome.tabs.create({ url: url });
      window.close();
    });
    actions.appendChild(enable);

    var opts = el('button', null, t('popupOpenOptions'));
    opts.type = 'button';
    opts.addEventListener('click', function () { chrome.runtime.openOptionsPage(); });
    actions.appendChild(opts);
  }

  async function main() {
    applyI18n();
    var body = document.getElementById('body');
    var tab = await getActiveTab();

    if (!tab || !tab.url || !/^https?:\/\//i.test(tab.url)) {
      renderMessage(body, 'popupNotHttp');
      return;
    }

    var origin = OJHScripts.normalizeOrigin(tab.url);
    var isDefault = OJHScripts.isDefaultOrigin(origin);
    var enabled = isDefault || await permissionsContains(origin);
    var hydro = await detectHydro(tab.id);

    if (!hydro) {
      renderMessage(body, 'popupNotHydro');
      return;
    }

    if (enabled) renderEnabled(body, origin, isDefault);
    else renderEnable(body, origin);
  }

  document.addEventListener('DOMContentLoaded', main);
})();
