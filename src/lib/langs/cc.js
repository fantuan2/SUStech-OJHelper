(function (g) {
  'use strict';

  if (!g.OJHCore) return;
  if (g.OJHCore.getLanguage('cc')) return;

  g.OJHCore.register({
    id: 'cc',
    name: 'C/C++',
    aliases: ['cc', 'cpp', 'c++', 'cplusplus', 'c'],
    implemented: false,
    commentSyntax: { lineComment: '//', blockComment: ['/*', '*/'] },
    schema: [],
    defaults: {},
    normalize: function (code) {
      return { code: String(code == null ? '' : code), changes: [] };
    }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
