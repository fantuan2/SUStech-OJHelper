(function (g) {
  'use strict';

  if (g.OJHSettingsUI) return;

  function t(key, vars) {
    return g.OJHI18n ? g.OJHI18n.t(key, vars) : key;
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------------------------------------------------------------- fields

  function buildTextField(f, flavor) {
    var wrap = el('div', 'ojh-field');
    var input = document.createElement('input');
    input.type = 'text';
    input.spellcheck = false;
    if (f.placeholder) input.placeholder = f.placeholder;

    if (flavor === 'hydro') {
      var label = el('label', 'material textbox');
      label.appendChild(document.createTextNode(t(f.labelKey)));
      label.appendChild(input);
      wrap.appendChild(label);
    } else {
      wrap.appendChild(el('label', 'ojh-field-label', t(f.labelKey)));
      input.className = 'ojh-field-input';
      wrap.appendChild(input);
    }
    if (f.hintKey) wrap.appendChild(el('span', 'ojh-field-hint', t(f.hintKey)));
    return {
      node: wrap,
      read: function () { return input.value.trim(); },
      write: function (v) { input.value = String(v == null ? '' : v); }
    };
  }

  function buildCheckboxField(f, flavor) {
    var input = document.createElement('input');
    input.type = 'checkbox';
    var labelText = t(f.labelKey);
    var node;
    if (flavor === 'hydro') {
      node = el('label', 'checkbox');
      input.className = 'checkbox';
      node.appendChild(input);
      node.appendChild(document.createTextNode(' ' + labelText));
    } else {
      node = el('label', 'ojh-check');
      node.appendChild(input);
      node.appendChild(el('span', null, labelText));
    }
    var wrap = el('div', 'ojh-field ojh-field-check');
    wrap.appendChild(node);
    return {
      node: wrap,
      read: function () { return !!input.checked; },
      write: function (v) { input.checked = !!v; }
    };
  }

  function buildField(f, flavor) {
    return f.type === 'checkbox' ? buildCheckboxField(f, flavor) : buildTextField(f, flavor);
  }

  // --------------------------------------------------------------- section

  function buildSection(title, flavor, open) {
    var d = document.createElement('details');
    d.className = 'ojh-sec';
    if (open) d.open = true;
    d.appendChild(el('summary', 'ojh-sec-title', title));
    d.appendChild(el('div', 'ojh-sec-body'));
    return d;
  }

  // ------------------------------------------------------------------ main

  function build(flavor) {
    flavor = flavor === 'hydro' ? 'hydro' : 'plain';
    var root = el('div', 'ojh-settings ojh-flavor-' + flavor);
    var commonControls = {};   // key -> control
    var langControls = {};     // moduleId -> { key -> control }
    var previewSelect = null;

    // -- common option groups (code / countdown)
    var groups = {};
    g.OJHSettings.COMMON_SCHEMA.forEach(function (f) {
      (groups[f.section] = groups[f.section] || []).push(f);
    });
    Object.keys(groups).forEach(function (sec) {
      var secEl = buildSection(t(g.OJHSettings.SECTION_TITLES[sec] || sec), flavor, true);
      var body = secEl.querySelector('.ojh-sec-body');
      groups[sec].forEach(function (f) {
        var ctl = buildField(f, flavor);
        commonControls[f.key] = ctl;
        body.appendChild(ctl.node);
      });
      root.appendChild(secEl);
    });

    // -- per-language sections
    var firstImplemented = true;
    g.OJHCore.listLanguages().forEach(function (mod) {
      var isSupported = mod.implemented !== false;
      var secEl = buildSection(mod.name, flavor, isSupported && firstImplemented);
      var body = secEl.querySelector('.ojh-sec-body');
      if (isSupported) {
        var ctrls = {};
        (mod.schema || []).forEach(function (f) {
          var ctl = buildField(f, flavor);
          ctrls[f.key] = ctl;
          body.appendChild(ctl.node);
        });
        langControls[mod.id] = ctrls;
        firstImplemented = false;
      } else {
        body.appendChild(el('div', 'ojh-sec-note', t('langUnsupported')));
      }
      root.appendChild(secEl);
    });

    // -- preview section
    var previewSec = buildSection(t('section.preview'), flavor, false);
    var pBody = previewSec.querySelector('.ojh-sec-body');

    previewSelect = document.createElement('select');
    previewSelect.className = 'ojh-preview-lang';
    g.OJHCore.listLanguages().forEach(function (mod) {
      var opt = document.createElement('option');
      opt.value = mod.id;
      opt.textContent = mod.name + (mod.implemented === false ? ' (' + t('langUnsupported') + ')' : '');
      previewSelect.appendChild(opt);
    });
    var implementedIds = g.OJHCore.listLanguages()
      .filter(function (m) { return m.implemented !== false; })
      .map(function (m) { return m.id; });
    if (implementedIds.length) previewSelect.value = implementedIds[0];
    pBody.appendChild(previewSelect);

    var previewInput = document.createElement('textarea');
    previewInput.className = 'ojh-preview-input';
    previewInput.spellcheck = false;
    previewInput.placeholder = t('previewInputPlaceholder');
    pBody.appendChild(previewInput);

    var previewOutput = document.createElement('textarea');
    previewOutput.className = 'ojh-preview-output';
    previewOutput.readOnly = true;
    previewOutput.placeholder = t('previewOutputPlaceholder');
    pBody.appendChild(previewOutput);

    var previewBtn = el('button', 'ojh-act' + (flavor === 'hydro' ? ' rounded button' : ''), t('previewBtn'));
    previewBtn.type = 'button';
    pBody.appendChild(previewBtn);
    root.appendChild(previewSec);

    // -- actions
    var actions = el('div', 'ojh-actions');
    var saveBtn = el('button', 'ojh-act primary' + (flavor === 'hydro' ? ' rounded primary button' : ''), t('save'));
    saveBtn.type = 'button';
    var status = el('span', 'ojh-status');
    actions.appendChild(saveBtn);
    actions.appendChild(status);
    root.appendChild(actions);

    // ------------------------------------------------------------ helpers

    function setStatus(text, ok) {
      status.textContent = text;
      status.className = 'ojh-status' + (ok ? ' ojh-ok' : '');
    }

    function readCommon() {
      var out = {};
      for (var k in commonControls) out[k] = commonControls[k].read();
      return out;
    }

    function readLanguages() {
      var out = {};
      for (var id in langControls) {
        var vals = {};
        for (var k in langControls[id]) vals[k] = langControls[id][k].read();
        out[id] = vals;
      }
      return out;
    }

    function fill(s) {
      var d = g.OJHSettings.defaults();
      var common = {};
      for (var k in d.common) common[k] = d.common[k];
      if (s && s.common) for (k in s.common) common[k] = s.common[k];
      for (k in commonControls) commonControls[k].write(common[k]);

      g.OJHCore.listLanguages().forEach(function (mod) {
        if (mod.implemented === false) return;
        var ctrls = langControls[mod.id];
        if (!ctrls) return;
        var vals = {};
        (mod.schema || []).forEach(function (f) { vals[f.key] = f.default; });
        var stored = s && s.languages && s.languages[mod.id];
        if (stored) for (var k2 in stored) if (stored[k2] !== undefined) vals[k2] = stored[k2];
        for (var k3 in ctrls) ctrls[k3].write(vals[k3]);
      });
    }

    function load(cb) {
      g.OJHSettings.get(function (s) {
        fill(s);
        if (cb) cb(s);
      });
    }

    function save(cb) {
      var s = g.OJHSettings.defaults();
      s.common = readCommon();
      s.languages = readLanguages();
      g.OJHSettings.set(s, function () {
        setStatus(t('saved'), true);
        setTimeout(function () { setStatus('', false); }, 2000);
        if (cb) cb(s);
      });
    }

    function preview() {
      var lang = previewSelect.value;
      var opts = {};
      var k;
      for (k in commonControls) opts[k] = commonControls[k].read();
      var ctrls = langControls[g.OJHCore.langKey(lang)] || {};
      for (k in ctrls) opts[k] = ctrls[k].read();
      var res = g.OJHCore.normalize(previewInput.value, lang, opts);
      previewOutput.value = res.code;
      if (!res.supported) {
        setStatus(t('langUnsupported'), false);
        return;
      }
      if (res.changes.length) {
        setStatus(t('changesLabel', { list: res.changes.map(function (c) { return c.label; }).join('、') }), false);
      } else {
        setStatus(t('noChanges'), false);
      }
    }

    previewBtn.addEventListener('click', preview);
    saveBtn.addEventListener('click', function () { save(); });

    return {
      root: root,
      load: load,
      save: save,
      preview: preview,
      statusEl: status
    };
  }

  g.OJHSettingsUI = { build: build };
})(typeof globalThis !== 'undefined' ? globalThis : this);
