import assert from 'node:assert/strict';
import { buildDailySentencePrompt, getProviderFallbackOrder, validateDailySentence } from '../app/api/_utils/dailySentence';
import { DEFAULT_AI_PROVIDER } from '../app/lib/aiModels';
import {
  DAILY_SENTENCES,
  getDayNumber,
  getFallbackDailySentence,
  getJstDateKey,
  secondsUntilJstMidnight,
} from '../app/utils/dailySentences';

// 日本时间：UTC 14:59 仍是当天，15:00 起算次日
assert.equal(getJstDateKey(new Date('2026-09-24T14:59:00Z')), '2026-09-24');
assert.equal(getJstDateKey(new Date('2026-09-24T15:00:00Z')), '2026-09-25');
assert.equal(secondsUntilJstMidnight(new Date('2026-09-24T14:00:00Z')), 3600);
assert.equal(getDayNumber('2026-09-25') - getDayNumber('2026-09-24'), 1);

// 备用句本身必须合格：分词能拼回原句、四种译文齐全
for (const sentence of DAILY_SENTENCES) {
  assert.doesNotThrow(() => validateDailySentence(sentence), sentence.text);
}
assert.ok(DAILY_SENTENCES.includes(getFallbackDailySentence(new Date('2026-09-24T03:00:00Z'))));

// 生成结果校验：分词拼不回原句、缺译文都要拒绝
const sample = DAILY_SENTENCES[0];
assert.throws(() => validateDailySentence({ ...sample, tokens: sample.tokens.slice(1) }), /拼回原句/);
assert.throws(() => validateDailySentence({ ...sample, translation: { ...sample.translation, ko: '' } }), /ko/);

// 格式约束：必须以「。」结尾，不含数字、字母、引号、括号
const withText = (text: string) => ({ ...sample, text, tokens: [{ word: text, pos: '名詞' }] });
assert.throws(() => validateDailySentence(withText('朝7時に起きます。')), /数字/);
assert.throws(() => validateDailySentence(withText('天気がいいから散歩しましょう')), /结尾/);
assert.throws(() => validateDailySentence(withText('「おはよう」と言いました。')), /引号/);
assert.throws(() => validateDailySentence(withText('Ｔシャツを買いました。')), /字母/);
assert.doesNotThrow(() => validateDailySentence(withText('今日はいい天気ですね。')));

// 相邻两天的提示词主题/语法不同，且带上当天日期与季节
const today = buildDailySentencePrompt('2026-09-24');
assert.notEqual(today, buildDailySentencePrompt('2026-09-25'));
assert.match(today, /2026-09-24/);
assert.match(today, /季节是秋/);
assert.match(buildDailySentencePrompt('2026-01-10'), /季节是冬/);

// 服务器自发调用时的供应商回退链：默认供应商必须排第一，四家都要覆盖且不重复。
// 历史上这里只认 gemini/deepseek，默认供应商换成商汤后「每日一句」直接取不到 Key。
const fallbackOrder = getProviderFallbackOrder();
assert.equal(fallbackOrder[0], DEFAULT_AI_PROVIDER, '默认供应商必须排在回退链首位');
assert.deepEqual([...fallbackOrder].sort(), ['deepseek', 'gemini', 'qiniu', 'sensenova']);
assert.equal(new Set(fallbackOrder).size, fallbackOrder.length, '回退链不应有重复项');

console.log('Daily sentence tests passed');
