// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

import type { Locale } from '../i18n';

export type ChangelogKind = 'new' | 'improved' | 'fixed';

export interface ChangelogEntry {
  /** 稳定标识，用来记录用户上次看到哪一条；只改文案时不要动它 */
  id: string;
  /** YYYY-MM-DD */
  date: string;
  kind: ChangelogKind;
  title: Record<Locale, string>;
  items: Record<Locale, string[]>;
}

/**
 * 更新日志。新增一条时放在数组最前面（最新的在最上），
 * id 用「日期-短名」，写完记得四条语言都填满。
 */
export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    id: '2026-10-18-corpus',
    date: '2026-10-18',
    kind: 'new',
    title: {
      'zh-CN': '真实语料检索',
      'zh-TW': '真實語料檢索',
      en: 'Real-world example search',
      ko: '실제 용례 검색',
    },
    items: {
      'zh-CN': [
        '点开一个词，可以额外检索真实例句，每一句都带来源链接，能点回去核对原文',
        '例句会与服务端检索结果逐条比对，模型自己编的句子会被丢弃',
        '同时标出语域（书面／口语、敬语程度），也可以把例句一键送回主流程继续解析',
      ],
      'zh-TW': [
        '點開一個詞，可以額外檢索真實例句，每一句都附來源連結，能點回去核對原文',
        '例句會與伺服器檢索結果逐條比對，模型自行編造的句子會被丟棄',
        '同時標出語域（書面／口語、敬語程度），也可以把例句一鍵送回主流程繼續解析',
      ],
      en: [
        'Open a word to look up real examples, each one linked to the page it came from',
        'Every sentence is checked against the search results, so invented examples are dropped',
        'Register is labelled (written or spoken, politeness level), and one click sends an example back to the main analyzer',
      ],
      ko: [
        '단어를 열면 출처 링크가 붙은 실제 예문을 추가로 검색할 수 있습니다',
        '모든 예문을 검색 결과와 대조해 모델이 지어낸 문장은 버립니다',
        '문체(문어/구어, 경어 수준)를 표시하고, 클릭 한 번으로 본문 분석으로 되돌려 보낼 수 있습니다',
      ],
    },
  },
  {
    id: '2026-10-15-qiniu',
    date: '2026-10-15',
    kind: 'new',
    title: {
      'zh-CN': '新增七牛云模型',
      'zh-TW': '新增七牛雲模型',
      en: 'Qiniu Cloud models',
      ko: '치니우윈 모델 추가',
    },
    items: {
      'zh-CN': [
        '设置里可以把七牛云选为模型服务商',
        '接口地址支持自定义，方便指向自己的网关',
      ],
      'zh-TW': [
        '設定裡可以把七牛雲選為模型服務商',
        '介面位址支援自訂，方便指向自己的閘道',
      ],
      en: [
        'Qiniu Cloud can now be selected as a model provider in Settings',
        'The API endpoint is customizable, so you can point it at your own gateway',
      ],
      ko: [
        '설정에서 치니우윈을 모델 제공자로 선택할 수 있습니다',
        'API 주소를 직접 지정해 자체 게이트웨이로 연결할 수 있습니다',
      ],
    },
  },
  {
    id: '2026-10-14-sensenova',
    date: '2026-10-14',
    kind: 'new',
    title: {
      'zh-CN': '新增商汤日日新支持',
      'zh-TW': '新增商湯日日新支援',
      en: 'SenseNova support',
      ko: '센스노바 지원',
    },
    items: {
      'zh-CN': [
        '支持商汤日日新模型，可在设置里切换',
        '接口地址留空时使用官方地址，也可以自己填',
        '每个服务商的 Key 分开保存，不用来回替换',
      ],
      'zh-TW': [
        '支援商湯日日新模型，可在設定裡切換',
        '介面位址留空時使用官方位址，也可以自行填寫',
        '每個服務商的 Key 分開儲存，不用來回替換',
      ],
      en: [
        'SenseNova models can now be selected in Settings',
        'The API endpoint falls back to the official URL when left empty, or you can set your own',
        'Each provider keeps its own API key, so nothing has to be swapped in and out',
      ],
      ko: [
        '설정에서 센스노바 모델을 선택할 수 있습니다',
        'API 주소를 비워 두면 공식 주소를 사용하고, 직접 지정할 수도 있습니다',
        '제공자마다 API 키를 따로 저장하므로 번갈아 입력할 필요가 없습니다',
      ],
    },
  },
  {
    id: '2026-10-04-stability',
    date: '2026-10-04',
    kind: 'improved',
    title: {
      'zh-CN': '登录与请求的稳定性加固',
      'zh-TW': '登入與請求的穩定性加固',
      en: 'Login and request hardening',
      ko: '로그인과 요청 안정성 강화',
    },
    items: {
      'zh-CN': [
        '登录失败次数有了限制，不会被反复尝试',
        '请求体大小和超时都有上限，长段落解析不容易卡住',
        '请求中断后界面能正确恢复，不会一直停在加载状态',
      ],
      'zh-TW': [
        '登入失敗次數有了限制，不會被反覆嘗試',
        '請求內容大小和逾時都有上限，長段落解析不容易卡住',
        '請求中斷後介面能正確恢復，不會一直停在載入狀態',
      ],
      en: [
        'Failed logins are rate limited instead of being retried endlessly',
        'Request size and timeouts are now bounded, so long passages no longer hang',
        'The UI recovers properly after a cancelled request instead of staying on a loading state',
      ],
      ko: [
        '로그인 실패 횟수에 제한이 생겨 무한 재시도를 막습니다',
        '요청 크기와 시간 초과에 상한을 두어 긴 문장도 멈추지 않습니다',
        '요청이 중단된 뒤 화면이 로딩 상태에 머물지 않고 정상으로 돌아옵니다',
      ],
    },
  },
  {
    id: '2026-09-27-error-locale',
    date: '2026-09-27',
    kind: 'improved',
    title: {
      'zh-CN': '错误提示跟随界面语言',
      'zh-TW': '錯誤提示跟隨介面語言',
      en: 'Error messages follow the interface language',
      ko: '오류 메시지 다국어 지원',
    },
    items: {
      'zh-CN': [
        '界面切成繁體中文、English 或 한국어 后，报错信息也会一起翻译',
        '上游服务返回的原始诊断信息保持原样，方便排查',
      ],
      'zh-TW': [
        '介面切成繁體中文、English 或 한국어 後，錯誤訊息也會一起翻譯',
        '上游服務回傳的原始診斷資訊保持原樣，方便排查',
      ],
      en: [
        'Error messages are translated along with the interface in all four languages',
        'Raw diagnostics from upstream services stay untouched, so troubleshooting still works',
      ],
      ko: [
        '인터페이스를 바꾸면 오류 메시지도 함께 번역됩니다',
        '상위 서비스가 보낸 원본 진단 내용은 그대로 두어 문제 파악에 쓸 수 있습니다',
      ],
    },
  },
  {
    id: '2026-09-24-reading-focus',
    date: '2026-09-24',
    kind: 'new',
    title: {
      'zh-CN': '阅读专注模式与词组选择',
      'zh-TW': '閱讀專注模式與詞組選擇',
      en: 'Reading focus mode and phrase selection',
      ko: '읽기 집중 모드와 구절 선택',
    },
    items: {
      'zh-CN': [
        '解析完成后输入框自动收起，给正文让出空间',
        '拖选多个词可以把它们当成一个整体来讲，拆错的词能一键合并',
      ],
      'zh-TW': [
        '解析完成後輸入框自動收起，給正文讓出空間',
        '拖選多個詞可以把它們當成一個整體來講，拆錯的詞能一鍵合併',
      ],
      en: [
        'The input box collapses after analysis, leaving more room for the text',
        'Select several words to explain them as a whole, and merge wrongly split words with one click',
      ],
      ko: [
        '분석이 끝나면 입력창이 자동으로 접혀 본문 공간이 넓어집니다',
        '여러 단어를 끌어 하나로 묶어 설명할 수 있고, 잘못 나뉜 단어는 한 번에 합칠 수 있습니다',
      ],
    },
  },
];

export const CHANGELOG_SEEN_STORAGE_KEY = 'changelogSeenId';

/** 最新一条的 id；没有内容时返回空串。 */
export function getLatestChangelogId(): string {
  return CHANGELOG_ENTRIES[0]?.id ?? '';
}

/** 有没有用户还没看过的新内容。 */
export function hasUnseenChangelog(seenId: string | null | undefined): boolean {
  const latest = getLatestChangelogId();
  if (!latest) return false;
  return seenId !== latest;
}

/**
 * 比已读位置更新的条目（数组里排在它前面的那些）。
 * 从没读过时返回空集合：第一次访问不该满屏都是「新」。
 */
export function getUnseenChangelogIds(seenId: string | null | undefined): Set<string> {
  if (!seenId) return new Set();
  const index = CHANGELOG_ENTRIES.findIndex(entry => entry.id === seenId);
  if (index <= 0) return new Set();
  return new Set(CHANGELOG_ENTRIES.slice(0, index).map(entry => entry.id));
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 日期按界面语言排版；解析不了就原样返回，避免把日期显示成 NaN。 */
export function formatChangelogDate(date: string, locale: Locale): string {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!matched) return date;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return date;

  if (locale === 'en') return `${EN_MONTHS[month - 1]} ${day}, ${year}`;
  if (locale === 'ko') return `${year}년 ${month}월 ${day}일`;
  return `${year}年${month}月${day}日`;
}

/** 取当前语言的内容；缺失时回落到简体中文，绝不返回 undefined。 */
export function pickChangelogText<T>(record: Record<Locale, T>, locale: Locale): T {
  return record[locale] ?? record['zh-CN'];
}
