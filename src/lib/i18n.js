(function (g) {
  'use strict';

  if (g.OJHI18n) return;

  var dicts = {
    zh: {
      optionsTitle: 'OJHelper 设置',
      optionsSub: 'Hydro OJ 辅助 · 代码规范化 + 比赛倒计时',
      sectionTitle: 'OJHelper 设置',
      'section.code': '代码通用',
      'section.countdown': '比赛倒计时',
      'section.nav': '比赛导航',
      'section.preview': '试运行',
      langUnsupported: '该语言暂未支持规范化',
      'opt.removeComments': '去除注释（// 与 /* */）',
      'opt.showCountdown': '在比赛列表和首页显示倒计时横幅',
      'opt.showContinueButton': '在首页显示「继续比赛」按钮',
      'java.mainClass': '主类名',
      'java.mainSignature': 'main 方法签名',
      'java.mainClassHint': '包含 main 方法的主类会被重命名为该名称。',
      'java.mainSignatureHint': 'main 方法的签名会被统一为该形式。',
      save: '保存',
      saved: '已保存 ✓',
      previewBtn: '预览规范化',
      previewInputPlaceholder: '粘贴代码，点击「预览规范化」查看结果（不会提交）',
      previewOutputPlaceholder: '预览结果',
      noChanges: '无需改动',
      changesLabel: '改动：{list}',
      normalizeBtn: '规范化',
      normalizedBtn: '已规范',
      unsupportedTitle: '该语言暂未支持规范化',
      unsupportedToast: '该语言（{lang}）暂未支持规范化',
      noEditorContent: '未找到编辑器内容',
      alreadyNormalized: '代码已符合规范，无需修改',
      normalizedToast: '已规范化：{list}',
      writeFailed: '写回编辑器失败',
      changeSettings: '更改规范化设置',
      countdownTitle: '比赛倒计时',
      'status.live': '进行中',
      'status.upcoming': '即将开始',
      'cd.start': '开始',
      'cd.end': '结束',
      'cd.remaining': '剩余',
      'unit.day': '天',
      'unit.hour': '时',
      'unit.minute': '分',
      'unit.second': '秒',
      enabledSites: '已启用的 OJ 站点',
      removeSite: '移除',
      defaultSite: '默认启用',
      siteBetaNote: '非 SUSTech 站点为 Beta 支持，可能与站点已有功能冲突，请谨慎启用。',
      popupTitle: 'OJHelper',
      popupNotHttp: '当前页面不是网页，无法识别。',
      popupNotHydro: '当前页面不是 Hydro OJ。',
      popupDefaultEnabled: 'SUSTech OJ：默认启用。',
      popupEnabled: '此站点已启用。',
      popupEnableSite: '启用此站点…',
      popupDisableSite: '停用此站点',
      popupOpenOptions: '打开设置',
      popupBeta: '非 SUSTech 站点为 Beta 支持，可能与本站已有功能冲突。',
      popupDisabledToast: '已停用，请刷新页面。',
      disclaimerTitle: '启用非默认 OJ 站点',
      disclaimerHeading: '高风险操作确认',
      disclaimerIntro: '你即将在非默认（非 SUSTech）的 Hydro 站点上启用 OJHelper。请在继续前仔细阅读以下风险。',
      disclaimerRisksTitle: '已知风险',
      'disclaimer.risk.beta': '非 SUSTech 站点的支持为 Beta，未经过充分测试。',
      'disclaimer.risk.conflict': '可能与站点已有的脚本或样式冲突，导致按钮重复、样式错乱或编辑器异常。',
      'disclaimer.risk.readwrite': '本扩展会读取并改写你当前编辑器中的代码。',
      'disclaimer.risk.verdict': '改写后的代码未必符合该站点的提交要求，可能导致判题错误。',
      'disclaimer.risk.liability': '使用本扩展所造成的一切后果由你自行承担，作者不承担任何责任。',
      disclaimerDiscourage: '如果你不确定该站点是否兼容，请勿启用。',
      disclaimerCheck: '我已阅读并理解上述全部风险，并自愿承担由此产生的后果。',
      disclaimerWait: '请先阅读风险（{sec} 秒后可继续）',
      disclaimerEnable: '我已知晓风险，仍要启用',
      disclaimerCancel: '取消',
      disclaimerNoOrigin: '缺少站点信息，无法启用。',
      disclaimerGrantFail: '未获得站点权限，启用已取消。',
      disclaimerEnabled: '已启用该站点。',
      disclaimerReloadHint: '请刷新该 OJ 页面以使其生效。',
      'locateMe.btn': '定位到我',
      'locateMe.notFound': '榜单中未找到你的账号（可能未参赛或被过滤）',
      'continue.btn': '继续比赛',
      'continue.none': '暂无进行中的比赛或已全部通过',
      'prevProblem': '上一题',
      'nextProblem': '下一题'
    },
    en: {
      optionsTitle: 'OJHelper Settings',
      optionsSub: 'Hydro OJ helper · code normalization + contest countdown',
      sectionTitle: 'OJHelper Settings',
      'section.code': 'Code (general)',
      'section.countdown': 'Contest countdown',
      'section.nav': 'Contest navigation',
      'section.preview': 'Try it out',
      langUnsupported: 'Not supported yet',
      'opt.removeComments': 'Remove comments (// and /* */)',
      'opt.showCountdown': 'Show countdown banner on the contest list and homepage',
      'opt.showContinueButton': 'Show the "Resume" button on the homepage',
      'java.mainClass': 'Main class name',
      'java.mainSignature': 'main method signature',
      'java.mainClassHint': 'The main class containing the main method will be renamed to this name.',
      'java.mainSignatureHint': 'The main method signature will be unified to this form.',
      save: 'Save',
      saved: 'Saved ✓',
      previewBtn: 'Preview',
      previewInputPlaceholder: 'Paste code and click Preview to see the result (nothing is submitted)',
      previewOutputPlaceholder: 'Preview result',
      noChanges: 'No changes needed',
      changesLabel: 'Changes: {list}',
      normalizeBtn: 'Normalize',
      normalizedBtn: 'Normalized',
      unsupportedTitle: 'This language is not supported yet',
      unsupportedToast: 'This language ({lang}) is not supported yet',
      noEditorContent: 'No editor content found',
      alreadyNormalized: 'Code is already normalized',
      normalizedToast: 'Normalized: {list}',
      writeFailed: 'Failed to write back to the editor',
      changeSettings: 'Change normalize settings',
      countdownTitle: 'Contest Countdown',
      'status.live': 'Live',
      'status.upcoming': 'Upcoming',
      'cd.start': 'Starts',
      'cd.end': 'Ends',
      'cd.remaining': 'Remaining',
      'unit.day': 'd',
      'unit.hour': 'h',
      'unit.minute': 'm',
      'unit.second': 's',
      enabledSites: 'Enabled OJ sites',
      removeSite: 'Remove',
      defaultSite: 'Enabled by default',
      siteBetaNote: 'Non-SUSTech sites are Beta support and may conflict with existing features. Enable with caution.',
      popupTitle: 'OJHelper',
      popupNotHttp: 'This page is not a web page and cannot be recognized.',
      popupNotHydro: 'This page is not a Hydro OJ.',
      popupDefaultEnabled: 'SUSTech OJ: enabled by default.',
      popupEnabled: 'This site is enabled.',
      popupEnableSite: 'Enable this site…',
      popupDisableSite: 'Disable this site',
      popupOpenOptions: 'Open settings',
      popupBeta: 'Non-SUSTech sites are Beta support and may conflict with this site\'s existing features.',
      popupDisabledToast: 'Disabled. Please reload the page.',
      disclaimerTitle: 'Enable non-default OJ site',
      disclaimerHeading: 'High-risk confirmation',
      disclaimerIntro: 'You are about to enable OJHelper on a non-default (non-SUSTech) Hydro site. Read the following risks carefully before continuing.',
      disclaimerRisksTitle: 'Known risks',
      'disclaimer.risk.beta': 'Support for non-SUSTech sites is Beta and not fully tested.',
      'disclaimer.risk.conflict': 'It may conflict with the site\'s existing scripts or styles, causing duplicate buttons, broken layout, or editor errors.',
      'disclaimer.risk.readwrite': 'This extension reads and rewrites the code in your current editor.',
      'disclaimer.risk.verdict': 'The rewritten code may not satisfy the site\'s submission requirements and may cause wrong verdicts.',
      'disclaimer.risk.liability': 'You bear all consequences of using this extension; the author accepts no responsibility.',
      disclaimerDiscourage: 'If you are not sure the site is compatible, do not enable it.',
      disclaimerCheck: 'I have read and understood all the risks above and accept the consequences.',
      disclaimerWait: 'Please read the risks first ({sec}s until you can continue)',
      disclaimerEnable: 'I understand the risks, enable anyway',
      disclaimerCancel: 'Cancel',
      disclaimerNoOrigin: 'Missing site information; cannot enable.',
      disclaimerGrantFail: 'Site permission was not granted; enabling cancelled.',
      disclaimerEnabled: 'Site enabled.',
      disclaimerReloadHint: 'Reload the OJ page for it to take effect.',
      'locateMe.btn': 'Locate me',
      'locateMe.notFound': 'Your account was not found on the scoreboard (not enrolled or filtered)',
      'continue.btn': 'Resume',
      'continue.none': 'No ongoing contest, or all problems solved',
      'prevProblem': 'Prev',
      'nextProblem': 'Next'
    }
  };

  var current = null;

  // Map a raw language code to a UI language: anything starting with "zh"
  // (zh, zh-CN, zh_TW, zh-Hant, ...) uses the Simplified-Chinese UI.
  function mapLang(raw) {
    var l = String(raw || '').toLowerCase().trim().replace('_', '-');
    return l.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function detectLang() {
    var raw = '';
    try { raw = document.documentElement.getAttribute('lang') || ''; } catch (e) { /* ignore */ }
    if (!raw) {
      try {
        if (g.chrome && g.chrome.i18n && g.chrome.i18n.getUILanguage) {
          raw = g.chrome.i18n.getUILanguage();
        }
      } catch (e) { /* ignore */ }
    }
    return mapLang(raw);
  }

  function lang() {
    if (!current) current = detectLang();
    return current;
  }

  function t(key, vars) {
    var d = dicts[lang()] || dicts.en;
    var s = d[key] !== undefined ? d[key] : (dicts.en[key] !== undefined ? dicts.en[key] : key);
    if (vars) {
      for (var k in vars) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      }
    }
    return s;
  }

  g.OJHI18n = {
    t: t,
    lang: lang,
    mapLang: mapLang,
    detectLang: detectLang,
    setLang: function (l) { current = mapLang(l); }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
