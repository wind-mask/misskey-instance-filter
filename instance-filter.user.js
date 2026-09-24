// ==UserScript==
// @name                Misskey Timeline Instance Filter
// @name:zh-CN          Misskey 实例过滤器 (全局流/白名单/语言)
// @name:ja             Misskey タイムライン インスタンス フィルター
// @namespace           https://github.com/Jarvie8176/misskey-instance-filter
// @version             1.2.0
// @description         Filter Misskey global timeline by instance whitelist and detected language
// @description:zh-CN   通过实例白名单与语言检测过滤 Misskey 全局流内容，支持自动翻页直至命中白名单实例内容。
// @description:ja      インスタンスのホワイトリストと言語検出でMisskeyのグローバルタイムラインをフィルタリングします。
// @author              JarvieK
// @license             MIT
// @match               *://*/*
// @match               *://misskey.io/*
// @include             *
// @icon                https://misskey-hub.net/favicon.ico
// @resource            mkFilterTinyld https://cdn.jsdelivr.net/npm/tinyld@1.3.4/dist/tinyld.light.browser.js
// @resource            mkFilterEld https://cdn.jsdelivr.net/gh/nitotm/efficient-language-detector-js@cd035164f78eafaac0c1dc7872bcd45eda80c337/minified/eld.xs.min.js
// @grant               GM_setValue
// @grant               GM_getValue
// @grant               GM_addStyle
// @grant               GM_getResourceText
// @grant               GM_xmlhttpRequest
// @connect             cdn.jsdelivr.net
// @connect             fastly.jsdelivr.net
// @connect             unpkg.com
// @connect             raw.githubusercontent.com
// @run-at              document-end
// ==/UserScript==

(function () {
    'use strict';

    const DEFAULT_SETTINGS = {
        lang: 'auto',
        maxPages: 2,
        instanceList: '',
        debug: false,
        wildcardSearch: false,
        hideLocal: false,
        instanceFilterEnabled: true,
        langFilterEnabled: false,
        langFilterMode: 'allow',
        langList: '',
        langEngine: 'tinyld',
        timelineScopes: 'home,public,list,antenna,channel,role,explore'
    };

    const TRANSLATIONS = {
        en: {
            title: "Instance Filter",
            listPlaceholder: "one.domain.per.line",
            instanceFilterLabel: "Instance Whitelist",
            langFilterLabel: "Language Filter",
            langModeLabel: "Mode:",
            langEngineLabel: "Engine:",
            langModeAllow: "Keep selected",
            langModeBlock: "Hide selected",
            langPlaceholder: "zh ja en (names like Chinese also work)",
            langHint: "Separated by space/comma. Notes whose language cannot be detected are kept.",
            langSupportedHint: "Detector supports:",
            langLibReady: "✅ Detector ready",
            langLibMissing: "⚠️ Detector not loaded",
            langLibRetry: "Download",
            langLibDownloading: "Downloading detector...",
            langLibFailed: "❌ Download failed",
            langEmptyWarning: "Language list is empty: add at least one language, or turn the filter off.",
            activeLabel: "Active: ",
            activeInstance: "instance whitelist",
            activeLangAllow: "language: keep {langs}",
            activeLangBlock: "language: hide {langs}",
            activeNone: "no filter enabled (auto-paging only)",
            maxPagesLabel: "Max Auto-Fetch (Max 10):",
            debugLabel: "Debug Mode:",
            hideLocalLabel: "Hide Local Feed:",
            langLabel: "Language:",
            saveBtn: "Save & Reload",
            cancelBtn: "Cancel",
            settingsTooltip: "Instance Filter Settings",
            placeholderTitle: "Content Filter",
            placeholderText: "🚫 {count} pages filtered continuously.",
            placeholderTrace: "Trace ID: {id}",
            auto: "Auto",
            blockedTitle: "Recently Blocked:",
            addBtn: "Add",
            searchPlaceholder: "Search instances...",
            wildcardLabel: "Wildcard (*)",
            scopeLabel: "Filter Scope",
            scopeHome: "Home",
            scopePublic: "Public",
            scopeList: "Lists",
            scopeAntenna: "Antennas",
            scopeChannel: "Channels",
            scopeRole: "Roles",
            scopeExplore: "Explore",
            scopeHint: "Public = local / social / global timelines. Uncheck to leave that endpoint unfiltered."
        },
        zh: {
            title: "实例过滤器",
            listPlaceholder: "每行一个域名 (例如: misskey.io)",
            instanceFilterLabel: "实例白名单",
            langFilterLabel: "语言过滤",
            langModeLabel: "过滤方式:",
            langEngineLabel: "检测引擎:",
            langModeAllow: "仅保留所选语言",
            langModeBlock: "隐藏所选语言",
            langPlaceholder: "zh ja en（也可写 中文 日语）",
            langHint: "空格或逗号分隔；识别不出语言的贴会保留。",
            langSupportedHint: "检测库支持:",
            langLibReady: "✅ 检测库已就绪",
            langLibMissing: "⚠️ 检测库未加载",
            langLibRetry: "重新下载",
            langLibDownloading: "正在下载检测库...",
            langLibFailed: "❌ 下载失败",
            langEmptyWarning: "语言列表为空：请填写至少一种语言，或关闭语言过滤。",
            activeLabel: "已启用：",
            activeInstance: "实例白名单",
            activeLangAllow: "语言：仅保留 {langs}",
            activeLangBlock: "语言：隐藏 {langs}",
            activeNone: "未启用任何过滤规则（仅自动翻页）",
            maxPagesLabel: "自动翻页上限 (最高10):",
            debugLabel: "调试模式:",
            hideLocalLabel: "隐藏本地内容:",
            langLabel: "界面语言:",
            saveBtn: "保存并重载",
            cancelBtn: "取消",
            settingsTooltip: "过滤器设置",
            placeholderTitle: "内容过滤器",
            placeholderText: "🚫 已连续过滤 {count} 页数据。",
            placeholderTrace: "追踪 ID: {id}",
            auto: "自动检测",
            blockedTitle: "最近拦截的实例:",
            addBtn: "添加",
            searchPlaceholder: "搜索实例...",
            wildcardLabel: "通配符 (*)",
            scopeLabel: "过滤范围",
            scopeHome: "首页",
            scopePublic: "公共",
            scopeList: "列表",
            scopeAntenna: "天线",
            scopeChannel: "频道",
            scopeRole: "角色",
            scopeExplore: "探索",
            scopeHint: "公共 = 本地 / 社交 / 全局时间线；取消勾选即可让该页面不过滤。"
        },
        ja: {
            title: "インスタンスフィルター",
            listPlaceholder: "1行に1つのドメイン (例: misskey.io)",
            instanceFilterLabel: "インスタンス許可リスト",
            langFilterLabel: "言語フィルター",
            langModeLabel: "モード:",
            langEngineLabel: "検出エンジン:",
            langModeAllow: "選択した言語のみ",
            langModeBlock: "選択した言語を非表示",
            langPlaceholder: "zh ja en（中国語 日本語 なども可）",
            langHint: "スペースまたはカンマ区切り。言語を判別できない投稿は残します。",
            langSupportedHint: "検出ライブラリ対応:",
            langLibReady: "✅ 検出ライブラリ準備完了",
            langLibMissing: "⚠️ 検出ライブラリ未読み込み",
            langLibRetry: "再ダウンロード",
            langLibDownloading: "検出ライブラリをダウンロード中...",
            langLibFailed: "❌ ダウンロード失敗",
            langEmptyWarning: "言語リストが空です。言語を入力するか、フィルターをオフにしてください。",
            activeLabel: "適用中：",
            activeInstance: "インスタンス許可リスト",
            activeLangAllow: "言語：{langs} のみ",
            activeLangBlock: "言語：{langs} を非表示",
            activeNone: "フィルターなし（自動ページングのみ）",
            maxPagesLabel: "自動取得上限 (最大10):",
            debugLabel: "デバッグモード:",
            hideLocalLabel: "ローカルを非表示:",
            langLabel: "表示言語:",
            saveBtn: "保存して再読み込み",
            cancelBtn: "キャンセル",
            settingsTooltip: "フィルター設定",
            placeholderTitle: "コンテンツフィルター",
            placeholderText: "🚫 合計 {count} ページを連続フィルタ済み。",
            placeholderTrace: "トレース ID: {id}",
            auto: "自動設定",
            blockedTitle: "最近ブロックされた:",
            addBtn: "追加",
            searchPlaceholder: "インスタンスを検索...",
            wildcardLabel: "ワイルドカード (*)",
            scopeLabel: "フィルター範囲",
            scopeHome: "ホーム",
            scopePublic: "パブリック",
            scopeList: "リスト",
            scopeAntenna: "アンテナ",
            scopeChannel: "チャンネル",
            scopeRole: "ロール",
            scopeExplore: "探索",
            scopeHint: "パブリック = ローカル / ソーシャル / グローバル。チェックを外すとその画面はフィルターされません。"
        }
    };

    const TARGET_META = 'meta[name="application-name"][content="Misskey"]';

    // ============== end of entrypoint ==============

    function hasMisskeyMeta() {
        return !!document.querySelector(TARGET_META);
    }

    function init() {
        if (window.__MK_FILTER_LOADED__) return;
        window.__MK_FILTER_LOADED__ = true;
        inject();
    }

    function getCurrentI18n() {
        const savedLang = GM_getValue('mk_filter_lang', DEFAULT_SETTINGS.lang);
        let langCode = savedLang;
        if (savedLang === 'auto') {
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('zh')) langCode = 'zh';
            else if (browserLang.startsWith('ja')) langCode = 'ja';
            else langCode = 'en';
        }
        return TRANSLATIONS[langCode] || TRANSLATIONS.en;
    }

    function getSearchPredicate(query, isWildcard) {
        if (!query) return () => true;
        if (isWildcard) {
            const pattern = query.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`, 'i');
            return (domain) => regex.test(domain);
        } else {
            const lowerQuery = query.toLowerCase();
            return (domain) => domain.toLowerCase().includes(lowerQuery);
        }
    }

    // ============== 语言检测 (tinyld light, MIT, https://github.com/komodojp/tinyld) ==============

    // 语言代码别名：ISO 639-2/639-3、地区变体、中文俗称 → ISO 639-1
    const LANG_ALIASES = {
        cmn: 'zh', chi: 'zh', zho: 'zh', cn: 'zh', chs: 'zh', cht: 'zh',
        jpn: 'ja', jp: 'ja',
        kor: 'ko', kr: 'ko',
        eng: 'en',
        fra: 'fr', fre: 'fr',
        deu: 'de', ger: 'de',
        spa: 'es',
        por: 'pt',
        ita: 'it',
        nld: 'nl', dut: 'nl',
        ell: 'el', gre: 'el',
        swe: 'sv',
        fin: 'fi',
        nob: 'no', nor: 'no',
        hun: 'hu',
        ron: 'ro', rum: 'ro',
        rus: 'ru',
        pol: 'pl',
        tur: 'tr',
        heb: 'he',
        ara: 'ar',
        hin: 'hi',
        ben: 'bn',
        tha: 'th',
        // ISO 639-2/639-3 代码（含 eld 支持但 tinyld light 不支持的语言）
        amh: 'am', ukr: 'uk', vie: 'vi', tgl: 'tl', fil: 'tl', aze: 'az', bel: 'be',
        bul: 'bg', cat: 'ca', ces: 'cs', cze: 'cs', dan: 'da', est: 'et', eus: 'eu', baq: 'eu',
        fas: 'fa', per: 'fa', guj: 'gu', hrv: 'hr', hye: 'hy', arm: 'hy', isl: 'is', ice: 'is',
        kat: 'ka', geo: 'ka', kan: 'kn', kur: 'ku', lao: 'lo', lit: 'lt', lav: 'lv', mal: 'ml',
        mar: 'mr', msa: 'ms', may: 'ms', ori: 'or', pan: 'pa', slk: 'sk', slo: 'sk', slv: 'sl',
        sqi: 'sq', alb: 'sq', srp: 'sr', tam: 'ta', tel: 'te', urd: 'ur', yor: 'yo',
        '中文': 'zh', '汉语': 'zh', '简体中文': 'zh', '繁体中文': 'zh',
        '日语': 'ja', '日文': 'ja',
        '英语': 'en', '英文': 'en',
        '韩语': 'ko', '韩文': 'ko',
        '俄语': 'ru', '法语': 'fr', '德语': 'de', '西班牙语': 'es',
        '葡萄牙语': 'pt', '意大利语': 'it', '荷兰语': 'nl', '希腊语': 'el',
        '瑞典语': 'sv', '芬兰语': 'fi', '挪威语': 'no', '匈牙利语': 'hu',
        '罗马尼亚语': 'ro', '波兰语': 'pl', '土耳其语': 'tr', '希伯来语': 'he',
        '阿拉伯语': 'ar', '印地语': 'hi', '孟加拉语': 'bn', '泰语': 'th'
    };

    // 语言检测引擎注册表：resource 对应元数据里的 @resource，supported 为该检测器会返回的语言代码
    const LANG_ENGINES = {
        tinyld: {
            label: 'tinyld light (24 langs, ~70KB)',
            resource: 'mkFilterTinyld',
            cacheKey: 'mk_filter_lang_lib_tinyld',
            globalName: '__MK_TINYLD__',
            format: 'esm', // 上游只发布 ESM 构建，注入前需要改写 export
            supported: ['zh', 'ja', 'ko', 'en', 'ru', 'th', 'ar', 'he', 'hi', 'bn', 'fr', 'de', 'es', 'pt', 'it', 'nl', 'pl', 'tr', 'el', 'sv', 'fi', 'no', 'hu', 'ro'],
            urls: [
                'https://cdn.jsdelivr.net/npm/tinyld@1.3.4/dist/tinyld.light.browser.js',
                'https://fastly.jsdelivr.net/npm/tinyld@1.3.4/dist/tinyld.light.browser.js',
                'https://unpkg.com/tinyld@1.3.4/dist/tinyld.light.browser.js'
            ]
        },
        eld: {
            label: 'eld XS (60 langs, ~940KB)',
            resource: 'mkFilterEld',
            cacheKey: 'mk_filter_lang_lib_eld',
            globalName: 'eld',
            format: 'iife', // 官方已提供压缩 IIFE，挂 globalThis.eld
            supported: ['am', 'ar', 'az', 'be', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'eu', 'fa', 'fi', 'fr', 'gu', 'he', 'hi', 'hr', 'hu', 'hy', 'is', 'it', 'ja', 'ka', 'kn', 'ko', 'ku', 'lo', 'lt', 'lv', 'ml', 'mr', 'ms', 'nl', 'no', 'or', 'pa', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sq', 'sr', 'sv', 'ta', 'te', 'th', 'tl', 'tr', 'uk', 'ur', 'vi', 'yo', 'zh'],
            urls: [
                'https://cdn.jsdelivr.net/gh/nitotm/efficient-language-detector-js@cd035164f78eafaac0c1dc7872bcd45eda80c337/minified/eld.xs.min.js',
                'https://fastly.jsdelivr.net/gh/nitotm/efficient-language-detector-js@cd035164f78eafaac0c1dc7872bcd45eda80c337/minified/eld.xs.min.js',
                'https://raw.githubusercontent.com/nitotm/efficient-language-detector-js/cd035164f78eafaac0c1dc7872bcd45eda80c337/minified/eld.xs.min.js'
            ]
        }
    };

    const LANG_ENGINE_IDS = ['tinyld', 'eld'];

    function getLangEngine(id) {
        return LANG_ENGINES[id] || LANG_ENGINES.tinyld;
    }

    // ============== 拦截范围（可勾选的 timeline） ==============

    // 面板上的勾选项；id 必须与主世界里的 SCOPE_ENDPOINTS 一一对应
    const TIMELINE_SCOPES = [
        { id: 'home', labelKey: 'scopeHome' },
        { id: 'public', labelKey: 'scopePublic' },
        { id: 'list', labelKey: 'scopeList' },
        { id: 'antenna', labelKey: 'scopeAntenna' },
        { id: 'channel', labelKey: 'scopeChannel' },
        { id: 'role', labelKey: 'scopeRole' },
        { id: 'explore', labelKey: 'scopeExplore' }
    ];

    const TIMELINE_SCOPE_IDS = TIMELINE_SCOPES.map(scope => scope.id);

    function parseScopeList(raw) {
        const result = [];
        String(raw == null ? '' : raw).split(/[\s,，]+/).forEach(token => {
            const id = token.trim().toLowerCase();
            if (id && TIMELINE_SCOPE_IDS.includes(id) && !result.includes(id)) result.push(id);
        });
        return result;
    }

    function normalizeLangCode(input) {
        if (!input) return '';
        let code = String(input).trim().toLowerCase();
        if (!code) return '';
        if (LANG_ALIASES[code]) return LANG_ALIASES[code];
        code = code.split(/[-_]/)[0];
        if (LANG_ALIASES[code]) return LANG_ALIASES[code];
        return /^[a-z]{2,3}$/.test(code) ? code : '';
    }

    function parseLangList(raw) {
        const result = [];
        String(raw || '').split(/[\s,，、;；|]+/).forEach(token => {
            const code = normalizeLangCode(token);
            if (code && !result.includes(code)) result.push(code);
        });
        return result;
    }

    // 把引擎资源处理成能直接注入页面主世界的普通脚本：
    // - tinyld 只发布 ESM，这里把尾部 export 语句改写为 IIFE 的 return（避开 ESM 的 CSP 与时序限制）
    // - eld 已有 IIFE 构建，原样注入
    function buildLangLibSource(rawSource, engineId) {
        const engine = getLangEngine(engineId);
        if (engine.format !== 'esm') return rawSource;

        let converted = false;
        const body = rawSource.replace(/export\s*\{([^}]*)\}\s*;?/g, (_, list) => {
            converted = true;
            const props = list.split(',').map(s => s.trim()).filter(Boolean).map(item => {
                const parts = item.split(/\s+as\s+/).map(s => s.trim());
                const local = parts[0];
                const exported = parts[1] || parts[0];
                return `${JSON.stringify(exported)}:${local}`;
            });
            return `return {${props.join(',')}};`;
        });
        if (!converted) {
            // 上游若改为 UMD/IIFE 构建：原样执行并尝试取其全局导出
            return `${rawSource}\n;window.${engine.globalName} = window.${engine.globalName} || window.tinyld || window.eld;`;
        }
        return `window.${engine.globalName} = (function(){${body}})();`;
    }

    // 把各引擎差异化的 API 归一化为 window.__MK_LANG_DETECT__.detect(text) -> ISO 639-1 或 ''
    function buildLangGlue(engineId) {
        const engine = getLangEngine(engineId);
        return [
            '(function () {',
            `    var lib = window.${engine.globalName};`,
            '    window.__MK_LANG_DETECT__ = {',
            `        name: ${JSON.stringify(engineId)},`,
            '        detect: function (text) {',
            '            try {',
            '                if (!lib || typeof lib.detect !== "function") return "";',
            '                var result = lib.detect(text);',
            '                // tinyld 直接返回语言代码，eld 返回 { language }',
            '                if (result && typeof result === "object") result = result.language;',
            '                return result ? String(result).toLowerCase() : "";',
            '            } catch (e) { return ""; }',
            '        }',
            '    };',
            '})();'
        ].join('\n');
    }

    // 优先取脚本管理器缓存的 @resource，其次取运行时下载的本地缓存
    function readLangLibSource(engineId) {
        const engine = getLangEngine(engineId);
        let raw = '';
        try {
            raw = GM_getResourceText(engine.resource) || '';
        } catch (e) {
            raw = '';
        }
        if (!raw) {
            try {
                raw = GM_getValue(engine.cacheKey, '') || '';
            } catch (e) {
                raw = '';
            }
        }
        // 内容明显异常（下载失败页/空文件）时按不可用处理
        return raw.length > 1000 ? raw : '';
    }

    // @resource 缺失时（安装时 CDN 不可达等）的兜底：依次尝试备用 CDN 并缓存到 GM 存储
    function downloadLangLib(engineId, callback) {
        const engine = getLangEngine(engineId);
        const urls = engine.urls;
        if (typeof GM_xmlhttpRequest !== 'function') {
            callback(false, 'GM_xmlhttpRequest unavailable');
            return;
        }
        const tryNext = (index, lastError) => {
            if (index >= urls.length) {
                callback(false, lastError || 'download failed');
                return;
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url: urls[index],
                // eld 体积接近 1MB，给更宽松的超时
                timeout: engineId === 'eld' ? 60000 : 20000,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300 && res.responseText && res.responseText.length > 1000) {
                        try {
                            GM_setValue(engine.cacheKey, res.responseText);
                        } catch (e) {
                            // 缓存失败不影响本次使用
                        }
                        callback(true, '');
                    } else {
                        tryNext(index + 1, `HTTP ${res.status}`);
                    }
                },
                onerror: () => tryNext(index + 1, 'network error'),
                ontimeout: () => tryNext(index + 1, 'timeout')
            });
        };
        tryNext(0, '');
    }

    function inject() {
        const localHost = window.location.hostname.toLowerCase();
        const isDebug = GM_getValue('mk_filter_debug', DEFAULT_SETTINGS.debug);

        const instanceFilterEnabled = GM_getValue('mk_filter_instance_enabled', DEFAULT_SETTINGS.instanceFilterEnabled) !== false;
        const langFilterMode = GM_getValue('mk_filter_lang_mode', DEFAULT_SETTINGS.langFilterMode) === 'block' ? 'block' : 'allow';
        const langList = parseLangList(GM_getValue('mk_filter_lang_list', DEFAULT_SETTINGS.langList));
        const savedEngine = GM_getValue('mk_filter_lang_engine', DEFAULT_SETTINGS.langEngine);
        const langEngineId = LANG_ENGINES[savedEngine] ? savedEngine : DEFAULT_SETTINGS.langEngine;
        const timelineScopes = parseScopeList(GM_getValue('mk_filter_timeline_scopes', DEFAULT_SETTINGS.timelineScopes));

        const config = {
            allowedInstances: GM_getValue('mk_filter_list', DEFAULT_SETTINGS.instanceList).split('\n').map(l => l.trim().toLowerCase()).filter(Boolean),
            maxAutoFetchPages: Math.min(10, parseInt(GM_getValue('mk_filter_max_pages', DEFAULT_SETTINGS.maxPages), 10)),
            debug: isDebug,
            hideLocal: GM_getValue('mk_filter_hide_local', DEFAULT_SETTINGS.hideLocal),
            localHost: localHost,
            instanceFilterEnabled: instanceFilterEnabled,
            langFilterEnabled: GM_getValue('mk_filter_lang_enabled', DEFAULT_SETTINGS.langFilterEnabled) === true,
            langFilterMode: langFilterMode,
            langList: langList,
            langAliases: LANG_ALIASES,
            langEngine: langEngineId,
            timelineScopes: timelineScopes,
            labels: i18n
        };
        if (config.instanceFilterEnabled && !config.hideLocal && !config.allowedInstances.includes(localHost)) {
            config.allowedInstances.push(localHost);
        }

        // 语言检测库体积较大（eld 近 1MB），只在语言过滤真正启用时才注入页面主世界
        let langLibSource = '';
        if (config.langFilterEnabled) {
            const rawLib = readLangLibSource(langEngineId);
            if (!rawLib) {
                config.langFilterEnabled = false;
                console.warn(`[MK Filter] Language detector asset (${langEngineId}) is missing; language filter is skipped on this page.`);
            } else if (config.langFilterMode === 'allow' && config.langList.length === 0) {
                // 白名单为空会把所有内容拦掉，视为未启用
                config.langFilterEnabled = false;
                console.warn('[MK Filter] Language list is empty; language filter is skipped on this page.');
            } else {
                langLibSource = [buildLangLibSource(rawLib, langEngineId), buildLangGlue(langEngineId)].join('\n');
            }
        }

        function injectedLogic() {
            const cfg = window.MK_FILTER_CONFIG;
            let globalContinuousFilteredCount = 0;

            const langCache = new Map();
            const LANG_CACHE_LIMIT = 3000;

            const langDetector = window.__MK_LANG_DETECT__;
            const detectLanguage = (cfg.langFilterEnabled && langDetector && typeof langDetector.detect === 'function')
                ? (text) => langDetector.detect(text)
                : null;

            if (cfg.debug) console.log('[MK Filter] Script Injected. Config:', cfg, '| detector:', !!detectLanguage);

            // 语言代码归一化：ISO 639-2/639-3、地区变体（zh-CN）→ ISO 639-1
            function normalizeLang(value) {
                let code = String(value || '').trim().toLowerCase();
                if (!code) return '';
                const aliases = cfg.langAliases || {};
                if (aliases[code]) return aliases[code];
                code = code.split(/[-_]/)[0];
                return aliases[code] || code;
            }

            // 取参与语言检测的文本：正文 + 内容警告 + 被转发内容的正文
            function collectText(note) {
                const parts = [];
                if (typeof note.text === 'string') parts.push(note.text);
                if (typeof note.cw === 'string') parts.push(note.cw);
                const renote = note.renote;
                if (renote) {
                    if (typeof renote.text === 'string') parts.push(renote.text);
                    if (typeof renote.cw === 'string') parts.push(renote.cw);
                }
                const text = parts.join('\n').trim();
                // 语言检测只需开头部分，避免长文浪费算力
                return text.length > 500 ? text.slice(0, 500) : text;
            }

            // 优先本地检测，检测不出（纯 emoji / 过短文本）时回退到 Misskey 自带的 lang 字段
            function resolveLang(note) {
                const text = collectText(note);
                if (text && detectLanguage) {
                    if (langCache.has(text)) {
                        const cached = langCache.get(text);
                        if (cached) return cached;
                    } else {
                        const detected = detectLanguage(text);
                        if (langCache.size >= LANG_CACHE_LIMIT) langCache.clear();
                        langCache.set(text, detected);
                        if (detected) return detected;
                    }
                }
                const renote = note.renote;
                return normalizeLang(note.lang || (renote && renote.lang) || '');
            }

            function isNoteAllowed(note) {
                try {
                    if (!note) return true;
                    const user = note.renote?.user || note.user;
                    const host = (user?.host || '').toLowerCase();

                    // 1) 本地内容 / 实例白名单
                    if (!host) {
                        if (cfg.hideLocal) {
                            if (cfg.debug) console.log(`[MK Filter] 🚫 Blocked Local Post: @${user?.username}`);
                            return false;
                        }
                    } else if (cfg.instanceFilterEnabled && !cfg.allowedInstances.includes(host)) {
                        if (cfg.debug) console.log(`[MK Filter] 🚫 Blocked: @${user?.username}@${host}`);
                        window.dispatchEvent(new CustomEvent('mk-filter-blocked-event', {detail: host}));
                        return false;
                    }

                    // 2) 语言过滤
                    if (cfg.langFilterEnabled) {
                        const lang = resolveLang(note);
                        if (lang) {
                            const listed = cfg.langList.includes(lang);
                            const allowed = cfg.langFilterMode === 'block' ? !listed : listed;
                            if (!allowed) {
                                if (cfg.debug) console.log(`[MK Filter] 🚫 Blocked by language (${lang}): @${user?.username}`);
                                return false;
                            }
                        } else if (cfg.debug) {
                            console.log(`[MK Filter] 🌐 Unknown language, kept: @${user?.username}`);
                        }
                    }
                    return true;
                } catch (e) {
                    return true;
                }
            }

            // 占位卡片底部展示当前生效的过滤规则
            function buildFilterSummary() {
                const items = [];
                if (cfg.instanceFilterEnabled) items.push(cfg.labels.activeInstance);
                if (cfg.langFilterEnabled) {
                    const tpl = cfg.langFilterMode === 'block' ? cfg.labels.activeLangBlock : cfg.labels.activeLangAllow;
                    items.push(tpl.replace('{langs}', cfg.langList.join(', ')));
                }
                if (!items.length) return cfg.labels.activeNone;
                return cfg.labels.activeLabel + items.join(' / ');
            }

            function createPlaceholder(lastId, count) {
                return [{
                    id: lastId, createdAt: new Date().toISOString(), userId: "filter_bot",
                    user: {
                        id: "filter_bot", name: cfg.labels.placeholderTitle, username: "filter", host: null,
                        avatarUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/%3E%3C/svg%3E"
                    },
                    text: `$[fg.color=888 ${cfg.labels.placeholderText.replace('{count}', count)}]\n$[fg.color=aaa ${cfg.labels.placeholderTrace.replace('{id}', lastId)}]\n\n${buildFilterSummary()}`,
                    cw: null, visibility: "public", localOnly: true, renoteCount: 0, repliesCount: 0, reactions: {}, fileIds: [], files: []
                }];
            }

            // 勾选项 -> 实际拦截规则。响应均为 note 数组、分页用 sinceId / untilId
            const SCOPE_ENDPOINTS = {
                home: [/\/api\/notes\/timeline/i],                          // 首页（关注）
                public: [/\/api\/notes\/(local|hybrid|global)-timeline/i],  // 本地 / 社交 / 全局
                list: [/\/api\/notes\/user-list-timeline/i],                // 用户列表
                antenna: [/\/api\/antennas\/notes/i],                        // 天线
                channel: [/\/api\/channels\/timeline/i],                     // 频道时间线
                role: [/\/api\/roles\/notes/i],                              // 角色时间线
                explore: [/\/api\/notes\/featured/i]                         // 探索精选
            };

            const activeScopes = Array.isArray(cfg.timelineScopes) ? cfg.timelineScopes : [];
            const activePatterns = [];
            activeScopes.forEach(scopeId => {
                const patterns = SCOPE_ENDPOINTS[scopeId];
                if (patterns) activePatterns.push(...patterns);
            });

            function isTimelineEndpoint(url) {
                return typeof url === 'string' && activePatterns.some(pattern => pattern.test(url));
            }

            // WebSocket Filtering
            const WS_Proto = window.WebSocket.prototype;

            // streaming 订阅表（channel id -> channel 名），用于按勾选范围决定推送是否过滤
            const wsChannelTypes = new Map();
            const SCOPE_CHANNELS = {
                hometimeline: 'home',
                localtimeline: 'public',
                hybridtimeline: 'public',
                globaltimeline: 'public',
                userlist: 'list',
                antenna: 'antenna',
                channel: 'channel',
                roletimeline: 'role'
            };

            const originalSend = WS_Proto.send;
            WS_Proto.send = function (data) {
                try {
                    const message = JSON.parse(data);
                    const body = message && message.body;
                    if (message && message.type === 'connect' && body && body.id) {
                        wsChannelTypes.set(body.id, String(body.channel || '').toLowerCase());
                    } else if (message && message.type === 'disconnect' && body && body.id) {
                        wsChannelTypes.delete(body.id);
                    } else if (message && message.type === 'disconnectAll') {
                        wsChannelTypes.clear();
                    }
                } catch (e) {
                    // 非 JSON 帧（如 ping）忽略
                }
                return originalSend.call(this, data);
            };

            const unmappedChannels = new Set();

            // 推送频道不属于 timeline 类（如 main / notifications）或所属范围未勾选时，直接放行
            function isWsNoteAllowed(channelId, note) {
                const channelType = wsChannelTypes.get(channelId);
                if (!channelType) {
                    // 未知频道一律放行，仅首次在调试模式下提醒（便于反馈未映射的频道名）
                    if (cfg.debug && channelId && !unmappedChannels.has(channelId)) {
                        unmappedChannels.add(channelId);
                        console.log(`[MK Filter] 🌐 Streaming channel not mapped, notes kept: ${channelId}`);
                    }
                    return true;
                }
                const scope = SCOPE_CHANNELS[channelType];
                if (!scope) return true;
                if (!activeScopes.includes(scope)) return true;
                return isNoteAllowed(note);
            }

            const originalAddEventListener = WS_Proto.addEventListener;
            WS_Proto.addEventListener = function (type, listener, options) {
                if (type === 'message' && typeof listener === 'function') {
                    const wrapped = function (event) {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'channel' && data.body?.type === 'note') {
                                if (!isWsNoteAllowed(data.body.id, data.body.body)) return;
                            }
                        } catch (e) {
                        }
                        return listener.call(this, event);
                    };
                    return originalAddEventListener.call(this, type, wrapped, options);
                }
                return originalAddEventListener.call(this, type, listener, options);
            };

            // Fetch API Filtering
            const originalFetch = window.fetch;

            window.fetch = async function (...args) {
                const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                if (!isTimelineEndpoint(url)) return originalFetch(...args);

                if (cfg.debug) console.log(`[MK Filter] 🛰️ Intercepting Timeline Fetch: ${url}`);

                let isRefreshRequest = false;
                try {
                    const body = JSON.parse(args[1].body);
                    if (body.sinceId) isRefreshRequest = true;
                } catch (e) {
                }

                const fetchLoop = async (fArgs, currentReqPageCount) => {
                    const response = await originalFetch(...fArgs);
                    if (!response.ok) return response;
                    const cloned = response.clone();
                    let data;
                    try {
                        data = await cloned.json();
                    } catch (e) {
                        return response;
                    }
                    if (!Array.isArray(data)) return response;

                    const filtered = data.filter(isNoteAllowed);

                    if (filtered.length > 0) {
                        if (cfg.debug) console.log(`[MK Filter] ✅ Passed ${filtered.length}/${data.length} notes.`);
                        globalContinuousFilteredCount = 0;
                        return new Response(JSON.stringify(filtered), {status: 200, headers: response.headers});
                    }

                    if (isRefreshRequest) {
                        if (cfg.debug) console.log(`[MK Filter] ⏳ Refresh yielded 0 results after filtering. Silencing.`);
                        return new Response(JSON.stringify([]), {status: 200, headers: response.headers});
                    }

                    if (data.length > 0 && currentReqPageCount <= cfg.maxAutoFetchPages) {
                        const lastId = data[data.length - 1].id;
                        if (cfg.debug) console.log(`[MK Filter] 🔄 Page ${currentReqPageCount} empty after filtering. Auto-fetching next... (untilId: ${lastId})`);
                        const nextArgs = [...fArgs];
                        try {
                            const body = JSON.parse(nextArgs[1].body);
                            body.untilId = lastId;
                            nextArgs[1].body = JSON.stringify(body);
                            return fetchLoop(nextArgs, currentReqPageCount + 1);
                        } catch (e) {
                        }
                    }

                    if (data.length > 0) {
                        globalContinuousFilteredCount += currentReqPageCount;
                        const lastId = data[data.length - 1].id;
                        if (cfg.debug) console.log(`[MK Filter] 🛑 Max auto-fetch reached. Displaying placeholder.`);
                        return new Response(JSON.stringify(createPlaceholder(lastId, globalContinuousFilteredCount)), {status: 200, headers: response.headers});
                    }
                    return response;
                };

                return fetchLoop(args, 1);
            };
        }

        // 检测库单独占一个 <script>：即使库本身解析或执行失败，也不会连带停掉下面的过滤逻辑
        const injectedSources = [
            `window.MK_FILTER_CONFIG = ${JSON.stringify(config)};\n(${injectedLogic.toString()})();`
        ];
        if (langLibSource) injectedSources.unshift(langLibSource);

        injectedSources.forEach(source => {
            const script = document.createElement('script');
            script.textContent = source;
            document.documentElement.appendChild(script);
            script.remove();
        });

        const blockedInstancesInUi = new Set();

        const setupUI = () => {
            GM_addStyle(`
                #mk-f-btn{position:fixed;bottom:20px;right:20px;z-index:99999;width:34px;height:34px;border-radius:50%;background:#31748f;color:#fff;border:none;cursor:pointer;opacity:0.6;transition:0.3s;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3)}
                #mk-f-btn:hover{opacity:1;transform:scale(1.1)}
                #mk-f-panel{position:fixed;bottom:65px;right:20px;z-index:99999;width:292px;max-height:calc(100vh - 90px);overflow-y:auto;background:var(--panel, #fff);color:var(--fg, #333);border-radius:12px;padding:15px;box-shadow:0 8px 30px rgba(0,0,0,0.3);display:none;font-family:sans-serif;font-size:13px;border:1px solid rgba(128,128,128,0.2)}
                #mk-f-list{width:100%;margin:0 0 10px 0;font-size:12px;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;display:block;background:var(--face, #fcfcfc);color:inherit;padding:8px;resize:vertical;min-height:80px}
                .mk-f-row{display:flex;justify-content:space-between;align-items:center;margin:8px 0}
                .mk-f-row select, .mk-f-row input[type="number"]{padding:2px 4px;border-radius:4px;border:1px solid #ccc;background:var(--face, #fff);color:inherit}
                .mk-f-scopes{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;margin:6px 0}
                .mk-f-scope{display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;white-space:nowrap}
                .mk-f-scope input{margin:0}
                .mk-f-section-title{font-weight:bold;font-size:12px}
                .mk-f-divider{height:1px;background:rgba(128,128,128,0.15);margin:12px 0}
                .mk-f-off{opacity:0.45;pointer-events:none;user-select:none}
                .mk-f-text-input{width:100%;padding:5px 8px;font-size:12px;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;background:var(--face, #fcfcfc);color:inherit}
                .mk-f-hint{font-size:10px;opacity:0.6;margin-top:5px;line-height:1.5}
                .mk-f-lang-status{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:10px;margin-top:6px}
                .mk-f-warning{display:none;margin-top:6px;padding:5px 7px;border-radius:5px;font-size:10px;line-height:1.4;background:rgba(220,53,69,0.12);color:#c0392b}
                .mk-f-mini-btn{padding:2px 7px;background:#31748f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:10px;line-height:1.4}
                .mk-f-mini-btn:disabled{opacity:0.6;cursor:default}
                .mk-f-blocked-area{margin-top:10px;padding-top:10px;border-top:1px dashed #ccc}
                .mk-f-search-container{display:flex;align-items:center;gap:5px;margin-bottom:5px}
                .mk-f-blocked-search{flex:1;padding:4px 8px;font-size:11px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;background:var(--face, #fff);color:inherit}
                .mk-f-wildcard-opt{display:flex;align-items:center;gap:3px;font-size:10px;white-space:nowrap;cursor:pointer;opacity:0.8}
                .mk-f-blocked-list{max-height:120px;overflow-y:auto;background:var(--face, #f9f9f9);border-radius:4px;padding:5px;margin-top:5px;border:1px solid #eee}
                .mk-f-blocked-item{display:flex;justify-content:space-between;padding:4px 4px;font-size:11px;border-bottom:1px solid #eee;align-items:center}
                .mk-f-add-btn{padding:2px 6px;background:#31748f;color:#fff;border-radius:4px;cursor:pointer;font-size:10px;border:none;line-height:1}
                .mk-f-btns{margin-top:15px;display:flex;gap:8px}
                .mk-f-btns button{flex:1;padding:8px;border:none;border-radius:6px;cursor:pointer;font-weight:bold}
                #mk-f-save{background:#28a745;color:#fff}
                #mk-f-cancel{background:#6c757d;color:#fff}
                .mk-f-footer{margin-top:12px;display:flex;justify-content:center;gap:15px;opacity:0.6;font-size:11px}
                .mk-f-footer a{color:inherit;text-decoration:none;display:flex;align-items:center;gap:4px}
                .mk-f-footer a:hover{opacity:1;text-decoration:underline}
            `);

            const div = document.createElement('div');
            div.innerHTML = `
                <button id="mk-f-btn" title="${i18n.settingsTooltip}">⚙️</button>
                <div id="mk-f-panel">
                    <div style="font-weight:bold;font-size:15px;margin-bottom:10px;color:#31748f;display:flex;align-items:center;gap:5px;">
                        <span>🛡️ ${i18n.title}</span>
                    </div>
                    <div class="mk-f-row">
                        <span class="mk-f-section-title">🏠 ${i18n.instanceFilterLabel}</span>
                        <input type="checkbox" id="mk-f-instance-toggle">
                    </div>
                    <div id="mk-f-instance-config">
                        <textarea id="mk-f-list" rows="5" placeholder="${i18n.listPlaceholder}"></textarea>
                        <div class="mk-f-blocked-area">
                            <div style="font-weight:bold;font-size:12px;margin-bottom:5px;">🕒 ${i18n.blockedTitle}</div>
                            <div class="mk-f-search-container">
                                <input type="text" id="mk-f-blocked-search" class="mk-f-blocked-search" placeholder="${i18n.searchPlaceholder}">
                                <label class="mk-f-wildcard-opt">
                                    <input type="checkbox" id="mk-f-wildcard-toggle"> ${i18n.wildcardLabel}
                                </label>
                            </div>
                            <div id="mk-f-blocked-list" class="mk-f-blocked-list"></div>
                        </div>
                    </div>
                    <div class="mk-f-divider"></div>
                    <div class="mk-f-row">
                        <span class="mk-f-section-title">🔤 ${i18n.langFilterLabel}</span>
                        <input type="checkbox" id="mk-f-lang-toggle">
                    </div>
                    <div id="mk-f-lang-config">
                        <div class="mk-f-row">
                            <span>${i18n.langModeLabel}</span>
                            <select id="mk-f-lang-mode">
                                <option value="allow">${i18n.langModeAllow}</option>
                                <option value="block">${i18n.langModeBlock}</option>
                            </select>
                        </div>
                        <div class="mk-f-row">
                            <span>${i18n.langEngineLabel}</span>
                            <select id="mk-f-lang-engine">${LANG_ENGINE_IDS.map(id => '<option value="' + id + '">' + LANG_ENGINES[id].label + '</option>').join('')}</select>
                        </div>
                        <input type="text" id="mk-f-lang-list" class="mk-f-text-input" placeholder="${i18n.langPlaceholder}">
                        <div class="mk-f-hint">${i18n.langHint}<br>${i18n.langSupportedHint} <span id="mk-f-lang-support"></span></div>
                        <div class="mk-f-lang-status">
                            <span id="mk-f-lang-status-text"></span>
                            <button id="mk-f-lang-retry" class="mk-f-mini-btn">${i18n.langLibRetry}</button>
                        </div>
                        <div id="mk-f-lang-warning" class="mk-f-warning"></div>
                    </div>
                    <div class="mk-f-divider"></div>
                    <div class="mk-f-row">
                        <span class="mk-f-section-title">🎯 ${i18n.scopeLabel}</span>
                    </div>
                    <div class="mk-f-scopes" id="mk-f-scope-list"></div>
                    <div class="mk-f-hint">${i18n.scopeHint}</div>
                    <div class="mk-f-divider"></div>
                    <div class="mk-f-row">
                        <span>🌐 ${i18n.langLabel}</span>
                        <select id="mk-f-lang">
                            <option value="auto">${i18n.auto}</option>
                            <option value="zh">简体中文</option>
                            <option value="en">English</option>
                            <option value="ja">日本語</option>
                        </select>
                    </div>
                    <div class="mk-f-row">
                        <span>🏠 ${i18n.hideLocalLabel}</span>
                        <input type="checkbox" id="mk-f-hide-local-toggle">
                    </div>
                    <div class="mk-f-row">
                        <span>📄 ${i18n.maxPagesLabel}</span>
                        <input type="number" id="mk-f-pages" style="width:45px" min="0" max="10">
                    </div>
                    <div class="mk-f-row">
                        <span>🐛 ${i18n.debugLabel}</span>
                        <input type="checkbox" id="mk-f-debug-toggle">
                    </div>
                    <div class="mk-f-btns">
                        <button id="mk-f-save">${i18n.saveBtn}</button>
                        <button id="mk-f-cancel">${i18n.cancelBtn}</button>
                    </div>
                    <div class="mk-f-footer">
                        <a href="https://github.com/Jarvie8176/misskey-instance-filter" target="_blank">📦 GitHub</a>
                        <a href="https://ko-fi.com/jk433552" target="_blank">☕ Ko-fi</a>
                    </div>
                </div>
            `;
            document.body.appendChild(div);

            const listInput = document.getElementById('mk-f-list');
            const blockedListDiv = document.getElementById('mk-f-blocked-list');
            const searchInput = document.getElementById('mk-f-blocked-search');
            const wildcardToggle = document.getElementById('mk-f-wildcard-toggle');
            const instanceToggle = document.getElementById('mk-f-instance-toggle');
            const instanceConfig = document.getElementById('mk-f-instance-config');
            const langToggle = document.getElementById('mk-f-lang-toggle');
            const langConfig = document.getElementById('mk-f-lang-config');
            const langModeSelect = document.getElementById('mk-f-lang-mode');
            const langListInput = document.getElementById('mk-f-lang-list');
            const langEngineSelect = document.getElementById('mk-f-lang-engine');
            const langSupportHint = document.getElementById('mk-f-lang-support');
            const langStatusText = document.getElementById('mk-f-lang-status-text');
            const langRetryBtn = document.getElementById('mk-f-lang-retry');
            const langWarning = document.getElementById('mk-f-lang-warning');
            const hideLocalToggle = document.getElementById('mk-f-hide-local-toggle');
            const debugToggle = document.getElementById('mk-f-debug-toggle');
            const pagesInput = document.getElementById('mk-f-pages');
            const uiLangSelect = document.getElementById('mk-f-lang');
            const scopeListDiv = document.getElementById('mk-f-scope-list');
            TIMELINE_SCOPES.forEach(scope => {
                const label = document.createElement('label');
                label.className = 'mk-f-scope';
                label.innerHTML = `<input type="checkbox" data-scope="${scope.id}"> ${i18n[scope.labelKey]}`;
                scopeListDiv.appendChild(label);
            });
            const scopeCheckboxes = Array.from(scopeListDiv.querySelectorAll('input[data-scope]'));

            function showWarning(message) {
                langWarning.textContent = message || '';
                langWarning.style.display = message ? 'block' : 'none';
            }

            function currentEngineId() {
                const value = langEngineSelect.value;
                return LANG_ENGINES[value] ? value : DEFAULT_SETTINGS.langEngine;
            }

            function refreshLangSupportHint() {
                langSupportHint.textContent = getLangEngine(currentEngineId()).supported.join(' ');
            }

            function refreshLangStatus() {
                if (readLangLibSource(currentEngineId())) {
                    langStatusText.textContent = i18n.langLibReady;
                    langRetryBtn.style.display = 'none';
                } else {
                    langStatusText.textContent = i18n.langLibMissing;
                    langRetryBtn.style.display = '';
                }
            }

            // 切换引擎时同步刷新语言支持列表与加载状态
            langEngineSelect.onchange = () => {
                refreshLangSupportHint();
                refreshLangStatus();
            };

            // 分区置灰：实例白名单 / 语言过滤互为独立开关
            function syncSections() {
                instanceConfig.classList.toggle('mk-f-off', !instanceToggle.checked);
                const langOn = langToggle.checked;
                langConfig.classList.toggle('mk-f-off', !langOn);
                langModeSelect.disabled = !langOn;
                langListInput.disabled = !langOn;
                langEngineSelect.disabled = !langOn;
                langRetryBtn.disabled = !langOn;
            }

            instanceToggle.onchange = syncSections;
            langToggle.onchange = syncSections;

            function renderBlocked() {
                blockedListDiv.innerHTML = '';
                const currentAllowed = listInput.value.split('\n').map(s => s.trim().toLowerCase());
                const query = searchInput.value.trim();
                const isWildcard = wildcardToggle.checked;
                const matchPredicate = getSearchPredicate(query, isWildcard);
                Array.from(blockedInstancesInUi)
                    .filter(domain => !currentAllowed.includes(domain) && matchPredicate(domain))
                    .sort((a, b) => a.localeCompare(b))
                    .forEach(domain => {
                        const item = document.createElement('div');
                        item.className = 'mk-f-blocked-item';
                        item.innerHTML = `<span>${domain}</span><button class="mk-f-add-btn" data-domain="${domain}">${i18n.addBtn} +</button>`;
                        blockedListDiv.appendChild(item);
                    });
                blockedListDiv.querySelectorAll('.mk-f-add-btn').forEach(b => {
                    b.onclick = (e) => {
                        const domain = e.target.getAttribute('data-domain');
                        const v = listInput.value.trim();
                        listInput.value = v ? v + '\n' + domain : domain;
                        renderBlocked();
                    };
                });
            }

            searchInput.oninput = renderBlocked;
            wildcardToggle.onchange = renderBlocked;
            listInput.oninput = renderBlocked;

            window.addEventListener('mk-filter-blocked-event', (e) => {
                const domain = e.detail;
                if (domain && !blockedInstancesInUi.has(domain)) {
                    blockedInstancesInUi.add(domain);
                    if (document.getElementById('mk-f-panel').style.display === 'block') renderBlocked();
                }
            });

            langRetryBtn.onclick = () => {
                showWarning('');
                langRetryBtn.disabled = true;
                langStatusText.textContent = i18n.langLibDownloading;
                downloadLangLib(currentEngineId(), (ok, err) => {
                    langRetryBtn.disabled = false;
                    if (ok) {
                        langStatusText.textContent = i18n.langLibReady;
                        langRetryBtn.style.display = 'none';
                        window.location.reload();
                    } else {
                        langStatusText.textContent = i18n.langLibFailed + (err ? ` (${err})` : '');
                        langRetryBtn.style.display = '';
                    }
                });
            };

            document.getElementById('mk-f-btn').onclick = () => {
                const panel = document.getElementById('mk-f-panel');
                const isVisible = panel.style.display === 'block';
                panel.style.display = isVisible ? 'none' : 'block';
                if (!isVisible) {
                    listInput.value = GM_getValue('mk_filter_list', DEFAULT_SETTINGS.instanceList);
                    instanceToggle.checked = GM_getValue('mk_filter_instance_enabled', DEFAULT_SETTINGS.instanceFilterEnabled) !== false;
                    langToggle.checked = GM_getValue('mk_filter_lang_enabled', DEFAULT_SETTINGS.langFilterEnabled) === true;
                    langModeSelect.value = GM_getValue('mk_filter_lang_mode', DEFAULT_SETTINGS.langFilterMode) === 'block' ? 'block' : 'allow';
                    const savedEngine = GM_getValue('mk_filter_lang_engine', DEFAULT_SETTINGS.langEngine);
                    langEngineSelect.value = LANG_ENGINES[savedEngine] ? savedEngine : DEFAULT_SETTINGS.langEngine;
                    refreshLangSupportHint();
                    langListInput.value = GM_getValue('mk_filter_lang_list', DEFAULT_SETTINGS.langList);
                    hideLocalToggle.checked = GM_getValue('mk_filter_hide_local', DEFAULT_SETTINGS.hideLocal);
                    debugToggle.checked = GM_getValue('mk_filter_debug', DEFAULT_SETTINGS.debug);
                    pagesInput.value = GM_getValue('mk_filter_max_pages', DEFAULT_SETTINGS.maxPages);
                    uiLangSelect.value = GM_getValue('mk_filter_lang', DEFAULT_SETTINGS.lang);
                    wildcardToggle.checked = GM_getValue('mk_filter_wildcard', DEFAULT_SETTINGS.wildcardSearch);
                    const savedScopes = parseScopeList(GM_getValue('mk_filter_timeline_scopes', DEFAULT_SETTINGS.timelineScopes));
                    scopeCheckboxes.forEach(box => { box.checked = savedScopes.includes(box.getAttribute('data-scope')); });
                    searchInput.value = '';
                    showWarning('');
                    refreshLangStatus();
                    syncSections();
                    renderBlocked();
                }
            };

            document.getElementById('mk-f-cancel').onclick = () => {
                document.getElementById('mk-f-panel').style.display = 'none';
            };

            function persistSettings() {
                const rawPages = parseInt(pagesInput.value, 10) || 0;
                const clampedPages = Math.min(10, Math.max(0, rawPages)); // 强制校验：0-10之间

                GM_setValue('mk_filter_list', listInput.value);
                GM_setValue('mk_filter_max_pages', clampedPages);
                GM_setValue('mk_filter_debug', debugToggle.checked);
                GM_setValue('mk_filter_hide_local', hideLocalToggle.checked);
                GM_setValue('mk_filter_lang', uiLangSelect.value);
                GM_setValue('mk_filter_wildcard', wildcardToggle.checked);
                GM_setValue('mk_filter_instance_enabled', instanceToggle.checked);
                GM_setValue('mk_filter_lang_enabled', langToggle.checked);
                GM_setValue('mk_filter_lang_mode', langModeSelect.value === 'block' ? 'block' : 'allow');
                GM_setValue('mk_filter_lang_engine', currentEngineId());
                GM_setValue('mk_filter_lang_list', langListInput.value);
                GM_setValue('mk_filter_timeline_scopes', scopeCheckboxes.filter(box => box.checked).map(box => box.getAttribute('data-scope')).join(','));
                window.location.reload();
            }

            document.getElementById('mk-f-save').onclick = () => {
                const langOn = langToggle.checked;
                const langMode = langModeSelect.value === 'block' ? 'block' : 'allow';
                const langs = parseLangList(langListInput.value);

                // 白名单模式下空列表会拦掉全部内容，必须先修正
                if (langOn && langMode === 'allow' && langs.length === 0) {
                    showWarning(i18n.langEmptyWarning);
                    return;
                }
                showWarning('');

                // 检测库缺失时先尝试补下载，成功后再落盘并重载
                if (langOn && !readLangLibSource(currentEngineId())) {
                    langStatusText.textContent = i18n.langLibDownloading;
                    langRetryBtn.disabled = true;
                    downloadLangLib(currentEngineId(), (ok, err) => {
                        langRetryBtn.disabled = false;
                        if (ok) {
                            persistSettings();
                        } else {
                            langStatusText.textContent = i18n.langLibFailed + (err ? ` (${err})` : '');
                            showWarning(i18n.langLibMissing);
                        }
                    });
                    return;
                }

                persistSettings();
            };
        };

        if (document.readyState === 'complete') {
            setupUI();
        } else {
            window.addEventListener('load', setupUI);
        }
    }

    // 入口放在文件末尾，确保上方所有 const 声明已完成初始化（避免 TDZ）
    const i18n = getCurrentI18n();

    if (hasMisskeyMeta()) {
        init();
    }
})();
