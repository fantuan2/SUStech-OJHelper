(function () {
  'use strict';

  if (window.__OJH_SETTINGS_PANEL__) return;
  window.__OJH_SETTINGS_PANEL__ = true;

  var SECTION_ID = 'ojh-settings-section';
  var ui = null;

  function t(key) {
    return window.OJHI18n ? window.OJHI18n.t(key) : key;
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function isPreferencePage() {
    return /\/home\/settings\/preference/.test(location.pathname);
  }

  function mainColumn() {
    var sec = document.querySelector('.main .section.visible');
    if (sec && sec.parentElement) return sec.parentElement;
    var col = document.querySelector('.main .medium-10.columns');
    return col || null;
  }

  function buildSectionShell() {
    var section = el('div', 'section visible');
    section.id = SECTION_ID;

    var header = el('div', 'section__header');
    header.appendChild(el('h1', 'section__title', t('sectionTitle')));
    section.appendChild(header);

    var body = el('div', 'section__body');
    section.appendChild(body);
    return { section: section, body: body };
  }

  function ensure() {
    if (!isPreferencePage()) return;
    if (document.getElementById(SECTION_ID)) return;
    var col = mainColumn();
    if (!col) return;

    var shell = buildSectionShell();
    ui = OJHSettingsUI.build('hydro');
    shell.body.appendChild(ui.root);
    ui.load();

    var first = col.querySelector('.section');
    if (first) col.insertBefore(shell.section, first);
    else col.insertBefore(shell.section, col.firstChild);
  }

  function init() {
    if (window.OJHDetect && !window.OJHDetect.isHydro()) return;
    ensure();
    var mo = new MutationObserver(function () { ensure(); });
    mo.observe(document.documentElement, { subtree: true, childList: true });
    setInterval(ensure, 2000);

    try {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'sync') return;
        if (document.getElementById(SECTION_ID) && ui) ui.load();
      });
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
