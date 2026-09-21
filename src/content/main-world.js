(function () {
  'use strict';

  if (window.__OJH_MAIN_WORLD__) return;
  window.__OJH_MAIN_WORLD__ = true;

  var CHANNEL = '__OJHELPER__';

  function post(msg) {
    msg.ch = CHANNEL;
    msg.dir = 'to-iso';
    try {
      window.postMessage(msg, location.origin);
    } catch (e) {
      window.postMessage(msg, '*');
    }
  }

  function currentPid() {
    var m = location.pathname.match(/\/p\/([\w.-]+)/);
    return m ? m[1] : null;
  }

  function pickModel() {
    if (!window.monaco || !window.monaco.editor) return null;
    try {
      if (typeof window.monaco.editor.getEditors === 'function') {
        var eds = window.monaco.editor.getEditors();
        for (var i = 0; i < eds.length; i++) {
          try {
            if (eds[i].hasTextFocus && eds[i].hasTextFocus()) {
              var fm = eds[i].getModel();
              if (fm) return fm;
            }
          } catch (e) { /* ignore */ }
        }
      }
    } catch (e) { /* ignore */ }

    var models = [];
    try {
      models = window.monaco.editor.getModels();
    } catch (e) {
      return null;
    }
    if (!models || !models.length) return null;

    var pid = currentPid();
    if (pid) {
      for (var j = 0; j < models.length; j++) {
        try {
          if (String(models[j].uri) === 'hydro:' + pid + '.java') return models[j];
        } catch (e) { /* ignore */ }
      }
      for (var k = 0; k < models.length; k++) {
        try {
          if (String(models[k].uri).indexOf('hydro:' + pid + '.') === 0) return models[k];
        } catch (e) { /* ignore */ }
      }
    }
    return models[0];
  }

  function modelInfo(model) {
    if (!model) return { code: '', lang: '', uri: '' };
    var lang = '';
    try { lang = model.getLanguageId(); } catch (e) { /* ignore */ }
    if (!lang) {
      try {
        var u = String(model.uri);
        var dot = u.lastIndexOf('.');
        if (dot >= 0) lang = u.slice(dot + 1);
      } catch (e) { /* ignore */ }
    }
    return { code: model.getValue(), lang: lang, uri: String(model.uri) };
  }

  function applyCode(model, code) {
    if (!model) return false;
    try {
      var full = model.getFullModelRange();
      model.pushEditOperations([], [{ range: full, text: code }], function () { return null; });
      return true;
    } catch (e) {
      try { model.setValue(code); return true; } catch (e2) { return false; }
    }
  }

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || d.ch !== CHANNEL || d.dir !== 'to-main') return;

    if (d.type === 'ping') {
      post({ type: 'pong', id: d.id, hasMonaco: !!(window.monaco && window.monaco.editor) });
      return;
    }

    if (d.type === 'get') {
      var model = pickModel();
      var info = modelInfo(model);
      post({ type: 'code', id: d.id, code: info.code, lang: info.lang, uri: info.uri, hasModel: !!model });
      return;
    }

    if (d.type === 'set') {
      var ok = applyCode(pickModel(), d.code);
      post({ type: 'set-done', id: d.id, ok: ok });
      return;
    }
  });
})();
