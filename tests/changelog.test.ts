import assert from 'node:assert/strict';
import {
  CHANGELOG_ENTRIES,
  formatChangelogDate,
  getLatestChangelogId,
  getUnseenChangelogIds,
  hasUnseenChangelog,
  pickChangelogText,
} from '../app/lib/changelog';
import { LOCALES } from '../app/i18n';

export function runChangelogTests() {
  // 数据完整性：id 唯一、日期可解析、四个语言都写满。
  const ids = new Set<string>();
  let previousDate = '9999-99-99';
  for (const entry of CHANGELOG_ENTRIES) {
    assert.ok(entry.id.trim(), 'Empty changelog id');
    assert.ok(!ids.has(entry.id), `Duplicate changelog id: ${entry.id}`);
    ids.add(entry.id);
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/, `Bad date format: ${entry.id}`);
    assert.ok(entry.date < previousDate, `Entries must be newest first: ${entry.id}`);
    previousDate = entry.date;

    for (const locale of LOCALES) {
      assert.ok(entry.title[locale]?.trim(), `Missing ${locale} title: ${entry.id}`);
      const items = entry.items[locale];
      assert.ok(Array.isArray(items) && items.length > 0, `Missing ${locale} items: ${entry.id}`);
      for (const item of items) assert.ok(item.trim(), `Empty ${locale} item: ${entry.id}`);
      const joined = [entry.title[locale], ...items].join('\n');
      assert.doesNotMatch(joined, /台灣|臺灣|台湾|Taiwan/, `Regional label leaked: ${entry.id} (${locale})`);
    }

    const baseCount = entry.items['zh-CN'].length;
    for (const locale of LOCALES) {
      assert.equal(entry.items[locale].length, baseCount, `Item count mismatch: ${entry.id} (${locale})`);
    }
  }

  // 已读水位：只有看过最新一条才算没有新内容。
  const latest = getLatestChangelogId();
  assert.equal(latest, CHANGELOG_ENTRIES[0].id);
  assert.equal(hasUnseenChangelog(null), true, 'First visit should surface the badge');
  assert.equal(hasUnseenChangelog(latest), false);
  assert.equal(hasUnseenChangelog(CHANGELOG_ENTRIES[1].id), true);
  assert.equal(hasUnseenChangelog('deleted-entry'), true);

  // 逐条「新」标记：比水位新的才算，首次访问一个都不标。
  assert.equal(getUnseenChangelogIds(null).size, 0);
  assert.equal(getUnseenChangelogIds(latest).size, 0);
  const older = getUnseenChangelogIds(CHANGELOG_ENTRIES[2].id);
  assert.equal(older.size, 2);
  assert.ok(older.has(CHANGELOG_ENTRIES[0].id) && older.has(CHANGELOG_ENTRIES[1].id));
  assert.equal(getUnseenChangelogIds('deleted-entry').size, 0);

  // 日期按语言排版，解析不了就原样返回。
  assert.equal(formatChangelogDate('2026-10-18', 'zh-CN'), '2026年10月18日');
  assert.equal(formatChangelogDate('2026-10-18', 'zh-TW'), '2026年10月18日');
  assert.equal(formatChangelogDate('2026-10-18', 'en'), 'Oct 18, 2026');
  assert.equal(formatChangelogDate('2026-10-18', 'ko'), '2026년 10월 18일');
  assert.equal(formatChangelogDate('2026-13-01', 'en'), '2026-13-01');
  assert.equal(formatChangelogDate('not-a-date', 'zh-CN'), 'not-a-date');

  // 语言缺失时回落到简体中文，避免界面出现 undefined。
  const title = CHANGELOG_ENTRIES[0].title;
  assert.equal(pickChangelogText(title, 'en'), title.en);
  assert.equal(
    pickChangelogText({ 'zh-CN': '简体', 'zh-TW': '繁體', en: undefined as unknown as string, ko: '한국어' }, 'en'),
    '简体'
  );

  console.log('changelog ok');
}
