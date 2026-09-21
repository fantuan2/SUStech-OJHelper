(function (g) {
  'use strict';

  if (!g.OJHCore) return;
  if (g.OJHCore.getLanguage('java')) return;

  var MODIFIERS = '(?:(?:public|protected|private|static|final|synchronized|strictfp|native|abstract)\\s+)*';
  var MAIN_HEADER = new RegExp(MODIFIERS + 'void\\s+main\\s*\\([^)]*\\)', 'g');

  function findTopLevelTypes(masked, depth) {
    var re = /(?:(?:public|protected|private|final|abstract|static|strictfp)\s+)*(class|interface|enum|record)\s+([A-Za-z_$][\w$]*)/g;
    var types = [];
    var m;
    while ((m = re.exec(masked)) !== null) {
      var keywordIndex = m.index + m[0].indexOf(m[1]);
      if (depth[keywordIndex] !== 0) continue;
      var name = m[2];
      var nameStart = m.index + m[0].length - name.length;
      var bodyStart = masked.indexOf('{', re.lastIndex);
      var bodyEnd = g.OJHCore.utils.matchBrace(masked, bodyStart);
      types.push({
        kind: m[1],
        name: name,
        nameStart: nameStart,
        nameEnd: nameStart + name.length,
        bodyStart: bodyStart,
        bodyEnd: bodyEnd
      });
      if (bodyEnd < 0) break;
    }
    return types;
  }

  function pickTarget(masked, types) {
    var mm = new RegExp(MAIN_HEADER.source, 'g').exec(masked);
    if (mm) {
      for (var t = 0; t < types.length; t++) {
        var ty = types[t];
        if (ty.bodyStart >= 0 && ty.bodyEnd >= 0 &&
            mm.index > ty.bodyStart && mm.index < ty.bodyEnd) {
          return ty;
        }
      }
    }
    for (var p = 0; p < types.length; p++) {
      var head = masked.slice(Math.max(0, types[p].nameStart - 40), types[p].nameStart);
      if (/\bpublic\b/.test(head)) return types[p];
    }
    return types.length ? types[0] : null;
  }

  function removePackages(code) {
    var re = /^[ \t]*package\b[^;\n]*;[ \t]*\r?\n?/gm;
    var count = 0;
    var out = code.replace(re, function () { count++; return ''; });
    return { code: out, count: count };
  }

  g.OJHCore.register({
    id: 'java',
    name: 'Java',
    aliases: ['java'],
    implemented: true,
    commentSyntax: { lineComment: '//', blockComment: ['/*', '*/'] },
    schema: [
      { key: 'mainClass', type: 'text', labelKey: 'java.mainClass', placeholder: 'Main', hintKey: 'java.mainClassHint', default: 'Main' },
      { key: 'mainSignature', type: 'text', labelKey: 'java.mainSignature', placeholder: 'public static void main(String[] args)', hintKey: 'java.mainSignatureHint', default: 'public static void main(String[] args)' }
    ],
    defaults: {
      mainClass: 'Main',
      mainSignature: 'public static void main(String[] args)'
    },
    normalize: function (code, opts, u) {
      var changes = [];
      var text = String(code == null ? '' : code);
      var mainClass = String(opts.mainClass || 'Main').trim() || 'Main';
      var mainSignature = String(opts.mainSignature || 'public static void main(String[] args)').trim() || 'public static void main(String[] args)';

      if (text.charCodeAt(0) === 0xfeff) {
        text = u.stripBOM(text);
        changes.push({ id: 'bom', label: '移除 BOM' });
      }

      var pkg = removePackages(text);
      if (pkg.count > 0) {
        text = pkg.code;
        changes.push({ id: 'package', label: '删除 package 声明' });
      }

      if (opts.removeComments) {
        var noComments = u.stripComments(text, this.commentSyntax);
        if (noComments !== text) {
          text = noComments;
          changes.push({ id: 'comments', label: '去除注释' });
        }
      }

      var masked = u.maskNonCode(text);
      var depth = u.computeDepths(masked);
      var types = findTopLevelTypes(masked, depth);
      var target = pickTarget(masked, types);

      if (target && target.name !== mainClass) {
        var oldName = target.name;
        var nameRe = new RegExp('\\b' + oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
        var ranges = [];
        var nm;
        while ((nm = nameRe.exec(masked)) !== null) {
          ranges.push({ start: nm.index, end: nm.index + oldName.length, text: mainClass });
        }
        if (ranges.length) {
          text = u.applyReplacements(text, ranges);
          changes.push({ id: 'rename', label: '主类 ' + oldName + ' → ' + mainClass });
        }
      }

      masked = u.maskNonCode(text);
      depth = u.computeDepths(masked);
      types = findTopLevelTypes(masked, depth);
      target = pickTarget(masked, types);

      var headerRe = new RegExp(MAIN_HEADER.source, 'g');
      var headers = [];
      var hm;
      while ((hm = headerRe.exec(masked)) !== null) {
        headers.push({ start: hm.index, end: hm.index + hm[0].length, text: mainSignature });
      }
      if (headers.length) {
        var before = text;
        text = u.applyReplacements(text, headers);
        if (text !== before) changes.push({ id: 'main-signature', label: '规范化 main 方法签名' });
      }

      return { code: text, changes: changes };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
