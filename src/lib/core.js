(function (g) {
  'use strict';

  if (g.OJHCore) return;

  // ---------------------------------------------------------------- registry

  var modules = [];
  var byId = {};
  var byAlias = {};

  function register(mod) {
    if (!mod || !mod.id) return;
    if (byId[mod.id]) return;
    modules.push(mod);
    byId[mod.id] = mod;
    byAlias[mod.id] = mod;
    (mod.aliases || []).forEach(function (a) {
      if (!byAlias[a]) byAlias[a] = mod;
    });
  }

  function getLanguage(lang) {
    return byAlias[langKey(lang)] || null;
  }

  function listLanguages() {
    return modules.slice();
  }

  // Normalize a language identifier: "cc.cc98" -> "cc", "Java" -> "java".
  function langKey(lang) {
    return String(lang || '').toLowerCase().trim().split('.')[0].split(':')[0];
  }

  function supported(lang) {
    var m = getLanguage(lang);
    return !!(m && m.implemented !== false);
  }

  function normalize(code, lang, opts) {
    var mod = getLanguage(lang);
    var src = String(code == null ? '' : code);
    if (!mod || mod.implemented === false) {
      return { code: src, changes: [], supported: false, lang: lang, moduleId: mod ? mod.id : null };
    }
    var res = mod.normalize(src, opts || {}, utils);
    res = res || {};
    res.supported = true;
    res.lang = lang;
    res.moduleId = mod.id;
    return res;
  }

  // ------------------------------------------------------ shared code utils

  function stripBOM(code) {
    return code.charCodeAt(0) === 0xfeff ? code.slice(1) : code;
  }

  // Replace the contents of comments and string/char literals with spaces,
  // preserving length and newlines so offsets stay valid.
  function maskNonCode(code) {
    var out = '';
    var i = 0;
    var n = code.length;
    var state = 'code';
    while (i < n) {
      var c = code[i];
      var c2 = code.substr(i, 2);
      var c3 = code.substr(i, 3);
      if (state === 'code') {
        if (c2 === '//') { state = 'line'; out += '  '; i += 2; continue; }
        if (c2 === '/*') { state = 'block'; out += '  '; i += 2; continue; }
        if (c3 === '"""') { state = 'text'; out += '   '; i += 3; continue; }
        if (c === '"') { state = 'str'; out += ' '; i += 1; continue; }
        if (c === "'") { state = 'chr'; out += ' '; i += 1; continue; }
        out += c; i += 1; continue;
      }
      if (state === 'line') {
        if (c === '\n') { state = 'code'; out += '\n'; i += 1; continue; }
        out += ' '; i += 1; continue;
      }
      if (state === 'block') {
        if (c2 === '*/') { state = 'code'; out += '  '; i += 2; continue; }
        out += c === '\n' ? '\n' : ' '; i += 1; continue;
      }
      if (state === 'str') {
        if (c === '\\') {
          out += ' ';
          out += i + 1 < n && code[i + 1] === '\n' ? '\n' : ' ';
          i += 2; continue;
        }
        if (c === '"') { state = 'code'; out += ' '; i += 1; continue; }
        out += c === '\n' ? '\n' : ' '; i += 1; continue;
      }
      if (state === 'chr') {
        if (c === '\\') {
          out += ' ';
          out += i + 1 < n && code[i + 1] === '\n' ? '\n' : ' ';
          i += 2; continue;
        }
        if (c === "'") { state = 'code'; out += ' '; i += 1; continue; }
        out += c === '\n' ? '\n' : ' '; i += 1; continue;
      }
      if (state === 'text') {
        if (c3 === '"""') { state = 'code'; out += '   '; i += 3; continue; }
        out += c === '\n' ? '\n' : ' '; i += 1; continue;
      }
    }
    return out;
  }

  // Remove line/block comments while preserving string literals and newlines.
  // syntax: { lineComment: '//', blockComment: ['/*', '*/'] }
  function stripComments(code, syntax) {
    var syn = syntax || {};
    var line = syn.lineComment || '//';
    var block = syn.blockComment || ['/*', '*/'];
    var open = block[0];
    var close = block[1];
    var out = '';
    var i = 0;
    var n = code.length;
    var state = 'code';
    while (i < n) {
      var c = code[i];
      var c3 = code.substr(i, 3);
      if (state === 'code') {
        if (line && code.substr(i, line.length) === line) { state = 'line'; i += line.length; continue; }
        if (open && code.substr(i, open.length) === open) { state = 'block'; i += open.length; continue; }
        if (c3 === '"""') { state = 'text'; out += '"""'; i += 3; continue; }
        if (c === '"') { state = 'str'; out += c; i += 1; continue; }
        if (c === "'") { state = 'chr'; out += c; i += 1; continue; }
        out += c; i += 1; continue;
      }
      if (state === 'line') {
        if (c === '\n') { state = 'code'; out += '\n'; }
        i += 1; continue;
      }
      if (state === 'block') {
        if (close && code.substr(i, close.length) === close) { state = 'code'; i += close.length; continue; }
        if (c === '\n') out += '\n';
        i += 1; continue;
      }
      if (state === 'str') {
        if (c === '\\') { out += c; if (i + 1 < n) out += code[i + 1]; i += 2; continue; }
        out += c;
        if (c === '"') state = 'code';
        i += 1; continue;
      }
      if (state === 'chr') {
        if (c === '\\') { out += c; if (i + 1 < n) out += code[i + 1]; i += 2; continue; }
        out += c;
        if (c === "'") state = 'code';
        i += 1; continue;
      }
      if (state === 'text') {
        if (c3 === '"""') { state = 'code'; out += '"""'; i += 3; continue; }
        out += c; i += 1; continue;
      }
    }
    return out;
  }

  function applyReplacements(text, ranges) {
    ranges = ranges.slice().sort(function (a, b) { return b.start - a.start; });
    var out = text;
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      out = out.slice(0, r.start) + r.text + out.slice(r.end);
    }
    return out;
  }

  function cleanupWhitespace(code) {
    var out = code;
    out = out.replace(/^(?:[ \t]*\r?\n)+/, '');
    out = out.replace(/[ \t\r\n]+$/, '');
    if (out.length && out[out.length - 1] !== '\n') out += '\n';
    return { code: out, changed: out !== code };
  }

  function computeDepths(masked) {
    var depth = new Array(masked.length + 1);
    var d = 0;
    for (var i = 0; i < masked.length; i++) {
      depth[i] = d;
      var c = masked[i];
      if (c === '{') d++;
      else if (c === '}') d--;
    }
    depth[masked.length] = d;
    return depth;
  }

  function matchBrace(masked, start) {
    if (start < 0) return -1;
    var d = 0;
    for (var i = start; i < masked.length; i++) {
      var c = masked[i];
      if (c === '{') d++;
      else if (c === '}') { d--; if (d === 0) return i; }
    }
    return -1;
  }

  var utils = {
    stripBOM: stripBOM,
    maskNonCode: maskNonCode,
    stripComments: stripComments,
    applyReplacements: applyReplacements,
    cleanupWhitespace: cleanupWhitespace,
    computeDepths: computeDepths,
    matchBrace: matchBrace
  };

  // --------------------------------------------- common options (shared UI)

  var commonSchema = [
    { section: 'code', key: 'removeComments', type: 'checkbox', labelKey: 'opt.removeComments', default: false }
  ];

  g.OJHCore = {
    register: register,
    getLanguage: getLanguage,
    listLanguages: listLanguages,
    langKey: langKey,
    supported: supported,
    normalize: normalize,
    commonSchema: commonSchema,
    utils: utils
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
