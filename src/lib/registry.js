(function (g) {
  'use strict';

  if (g.OJHScripts) return;

  // Default site: enabled out of the box via static manifest entries.
  var DEFAULT_ORIGINS = ['https://acm.sustech.edu.cn'];

  var MAIN_WORLD = {
    js: ['src/content/main-world.js'],
    world: 'MAIN',
    runAt: 'document_start'
  };

  var ISOLATED = {
    js: [
      'src/lib/core.js',
      'src/lib/hydro.js',
      'src/lib/i18n.js',
      'src/lib/langs/java.js',
      'src/lib/langs/cc.js',
      'src/lib/settings.js',
      'src/lib/settings-ui.js',
      'src/lib/contest-util.js',
      'src/content/settings-panel.js',
      'src/content/contest-countdown.js',
      'src/content/scoreboard-navigate.js',
      'src/content/continue-contest.js',
      'src/content/problem-nav.js',
      'src/content/isolated.js'
    ],
    css: ['src/lib/settings-ui.css', 'src/content/ui.css'],
    runAt: 'document_idle'
  };

  // Build the chrome.scripting.registerContentScripts payload for one origin.
  function descriptorsFor(origin, prefix) {
    var match = origin + '/d/*';
    var p = prefix || 'ojh';
    var base = p + '-' + origin.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    return [
      {
        id: base + '-main',
        matches: [match],
        js: MAIN_WORLD.js.slice(),
        runAt: MAIN_WORLD.runAt,
        world: MAIN_WORLD.world,
        allFrames: false
      },
      {
        id: base + '-iso',
        matches: [match],
        js: ISOLATED.js.slice(),
        css: ISOLATED.css.slice(),
        runAt: ISOLATED.runAt,
        allFrames: false
      }
    ];
  }

  function isDefaultOrigin(origin) {
    return DEFAULT_ORIGINS.indexOf(origin) >= 0;
  }

  // "https://foo.com/*" -> "https://foo.com"
  function normalizeOrigin(originPattern) {
    var s = String(originPattern || '').replace(/\/\*?$/, '');
    var m = s.match(/^([a-z][a-z0-9+.-]*:\/\/[^/]+)/i);
    return m ? m[1].toLowerCase() : s.toLowerCase();
  }

  g.OJHScripts = {
    DEFAULT_ORIGINS: DEFAULT_ORIGINS,
    MAIN_WORLD: MAIN_WORLD,
    ISOLATED: ISOLATED,
    ID_PREFIX: 'ojh',
    descriptorsFor: descriptorsFor,
    isDefaultOrigin: isDefaultOrigin,
    normalizeOrigin: normalizeOrigin
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
