(function (g) {
  'use strict';

  if (g.OJHSettings) return;

  var SCHEMA_VERSION = 2;

  var COMMON_SCHEMA = [
    { section: 'code', key: 'removeComments', type: 'checkbox', labelKey: 'opt.removeComments', default: false },
    { section: 'countdown', key: 'showContestCountdown', type: 'checkbox', labelKey: 'opt.showCountdown', default: true },
    { section: 'nav', key: 'showContinueButton', type: 'checkbox', labelKey: 'opt.showContinueButton', default: true }
  ];

  var SECTION_TITLES = {
    code: 'section.code',
    countdown: 'section.countdown',
    nav: 'section.nav'
  };

  var LEGACY_KEYS = ['mainClass', 'mainSignature', 'insertMainIfMissing', 'removeComments', 'notifyEnabled', 'notifyThresholds'];

  var storage = null;
  try {
    if (g.chrome && g.chrome.storage && g.chrome.storage.sync) storage = g.chrome.storage.sync;
  } catch (e) { storage = null; }

  function setStorageAdapter(adapter) { storage = adapter || null; }

  function defaults() {
    var common = {};
    COMMON_SCHEMA.forEach(function (f) { common[f.key] = f.default; });
    var languages = {};
    if (g.OJHCore) {
      g.OJHCore.listLanguages().forEach(function (m) {
        if (m.implemented === false) return;
        var o = {};
        (m.schema || []).forEach(function (f) { o[f.key] = f.default; });
        languages[m.id] = o;
      });
    }
    return { schemaVersion: SCHEMA_VERSION, common: common, languages: languages };
  }

  // Convert whatever is in storage into a valid v2 settings object.
  // Returns { settings, migrated, legacyKeys }.
  function migrate(all) {
    all = all || {};
    var s = defaults();

    var legacyKeys = LEGACY_KEYS.filter(function (k) {
      return Object.prototype.hasOwnProperty.call(all, k);
    });
    var hasLegacy = legacyKeys.length > 0;

    if (hasLegacy) {
      if (typeof all.removeComments === 'boolean') s.common.removeComments = all.removeComments;
      if (typeof all.mainClass === 'string' && all.mainClass) s.languages.java.mainClass = all.mainClass;
      if (typeof all.mainSignature === 'string' && all.mainSignature) s.languages.java.mainSignature = all.mainSignature;
    }
    // v2 values (if already present) win over stale legacy keys.
    if (all.common && typeof all.common === 'object') {
      for (var ck in s.common) {
        if (all.common[ck] !== undefined) s.common[ck] = all.common[ck];
      }
    }
    if (all.languages && typeof all.languages === 'object') {
      for (var id in s.languages) {
        var stored = all.languages[id];
        if (stored && typeof stored === 'object') {
          for (var lk in s.languages[id]) {
            if (stored[lk] !== undefined) s.languages[id][lk] = stored[lk];
          }
        }
      }
    }
    return { settings: s, migrated: hasLegacy, legacyKeys: legacyKeys };
  }

  function get(cb) {
    if (!storage) { cb(defaults()); return; }
    try {
      storage.get(null, function (all) {
        var r = migrate(all || {});
        if (r.migrated && r.legacyKeys.length) {
          try {
            storage.set(r.settings, function () { /* ignore */ });
            storage.remove(r.legacyKeys, function () { /* ignore */ });
          } catch (e) { /* ignore */ }
        }
        cb(r.settings);
      });
    } catch (e) {
      cb(defaults());
    }
  }

  function set(settings, cb) {
    if (!storage) { if (cb) cb(); return; }
    try {
      storage.set(settings || {}, function () { if (cb) cb(); });
    } catch (e) { if (cb) cb(); }
  }

  // Flatten common + per-language options for a given language identifier.
  function optionsFor(lang, settings) {
    var key = g.OJHCore ? g.OJHCore.langKey(lang) : String(lang || '').toLowerCase().split('.')[0];
    var d = defaults();
    var out = {};
    var k;
    for (k in d.common) out[k] = d.common[k];
    var dl = d.languages[key] || {};
    for (k in dl) out[k] = dl[k];
    if (settings) {
      var c = settings.common || {};
      for (k in c) if (c[k] !== undefined) out[k] = c[k];
      var l = (settings.languages && settings.languages[key]) || {};
      for (k in l) if (l[k] !== undefined) out[k] = l[k];
    }
    return out;
  }

  g.OJHSettings = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    COMMON_SCHEMA: COMMON_SCHEMA,
    SECTION_TITLES: SECTION_TITLES,
    defaults: defaults,
    migrate: migrate,
    get: get,
    set: set,
    optionsFor: optionsFor,
    setStorageAdapter: setStorageAdapter
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
