'use strict';

importScripts('lib/registry.js');

var DEFAULT_ORIGINS = OJHScripts.DEFAULT_ORIGINS;

function unregisterAll(cb) {
  chrome.scripting.getRegisteredContentScripts(function (list) {
    var ids = (list || [])
      .filter(function (s) { return s.id && s.id.indexOf(OJHScripts.ID_PREFIX + '-') === 0; })
      .map(function (s) { return s.id; });
    if (!ids.length) { if (cb) cb(); return; }
    chrome.scripting.unregisterContentScripts({ ids: ids }, function () {
      void chrome.runtime.lastError;
      if (cb) cb();
    });
  });
}

function syncRegistered(cb) {
  chrome.permissions.getAll(function (perms) {
    var origins = (perms && perms.origins) || [];
    var targets = [];
    origins.forEach(function (p) {
      var origin = OJHScripts.normalizeOrigin(p);
      if (!origin || OJHScripts.isDefaultOrigin(origin)) return;
      if (targets.indexOf(origin) < 0) targets.push(origin);
    });

    unregisterAll(function () {
      if (!targets.length) { if (cb) cb(); return; }
      var descriptors = [];
      targets.forEach(function (origin) {
        descriptors = descriptors.concat(OJHScripts.descriptorsFor(origin));
      });
      chrome.scripting.registerContentScripts(descriptors, function () {
        void chrome.runtime.lastError;
        if (cb) cb();
      });
    });
  });
}

function reloadTabsFor(origin) {
  var prefix = origin + '/d/';
  chrome.tabs.query({}, function (tabs) {
    (tabs || []).forEach(function (tab) {
      if (tab && tab.url && tab.url.indexOf(prefix) === 0) {
        chrome.tabs.reload(tab.id, function () { void chrome.runtime.lastError; });
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(function () { syncRegistered(); });
chrome.runtime.onStartup.addListener(function () { syncRegistered(); });

try {
  chrome.permissions.onAdded.addListener(function () { syncRegistered(); });
  chrome.permissions.onRemoved.addListener(function () { syncRegistered(); });
} catch (e) { /* ignore */ }

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || msg.type !== 'ojh-site-enabled') return;
  var origin = OJHScripts.normalizeOrigin(msg.origin);
  if (!origin) { sendResponse({ ok: false }); return; }
  syncRegistered(function () {
    reloadTabsFor(origin);
    sendResponse({ ok: true });
  });
  return true;
});
