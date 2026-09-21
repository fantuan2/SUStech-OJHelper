'use strict';

(function () {
  function t(key) {
    return window.OJHI18n ? window.OJHI18n.t(key) : key;
  }

  function applyI18n() {
    document.documentElement.lang = OJHI18n.lang();
    document.title = t('optionsTitle');
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
  }

  function renderSites() {
    var list = document.getElementById('ojh-sites-list');
    if (!list) return;
    list.innerHTML = '';

    chrome.permissions.getAll(function (perms) {
      var origins = (perms && perms.origins) || [];
      var seen = {};
      var sites = [];

      OJHScripts.DEFAULT_ORIGINS.forEach(function (o) {
        var origin = OJHScripts.normalizeOrigin(o);
        if (!seen[origin]) { seen[origin] = true; sites.push({ origin: origin, def: true }); }
      });
      origins.forEach(function (p) {
        var origin = OJHScripts.normalizeOrigin(p);
        if (!origin || seen[origin]) return;
        seen[origin] = true;
        sites.push({ origin: origin, def: OJHScripts.isDefaultOrigin(origin) });
      });

      sites.forEach(function (site) {
        var li = document.createElement('li');
        li.className = 'ojh-site';

        var name = document.createElement('span');
        name.className = 'ojh-site-name';
        name.textContent = site.origin;
        li.appendChild(name);

        if (site.def) {
          var badge = document.createElement('span');
          badge.className = 'ojh-site-badge';
          badge.textContent = t('defaultSite');
          li.appendChild(badge);
        } else {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ojh-site-remove';
          btn.textContent = t('removeSite');
          btn.addEventListener('click', function () {
            chrome.permissions.remove({ origins: [site.origin + '/*'] }, function () {
              void chrome.runtime.lastError;
              renderSites();
            });
          });
          li.appendChild(btn);
        }

        list.appendChild(li);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyI18n();
    var ui = OJHSettingsUI.build('plain');
    document.getElementById('ojh-root').appendChild(ui.root);
    ui.load();
    renderSites();

    try {
      chrome.permissions.onAdded.addListener(renderSites);
      chrome.permissions.onRemoved.addListener(renderSites);
    } catch (e) { /* ignore */ }
  });
})();
