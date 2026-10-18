import type { CorpusSearchHit } from '../api/_utils/deepseekTools';
import { CORPUS_QUERY_LIMIT } from '../api/_utils/deepseekTools';

/** 日语词典与原始语料站点：命中即视为高可信来源。 */
const REFERENCE_DOMAINS: Record<string, number> = {
  'weblio.jp': 6,
  'ejje.weblio.jp': 6,
  'thesaurus.weblio.jp': 5,
  'dictionary.goo.ne.jp': 6,
  'kotobank.jp': 6,
  'jisho.org': 5,
  'aozora.gr.jp': 6,
};

/** 词形清洗：搜索接口对引号、括号和换行很敏感。 */
export function sanitizeCorpusTerm(word: string): string {
  return word
    // 各类引号、括号和标点会把 query 切碎
    .replace(/[「」『』【】\[\]()（）"“”'‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30);
}

/**
 * 构造检索词。刻意不加 site: ——DeepSeek 的 OR 作用域在混合关键词时不明确，
 * 与其赌解析结果，不如全量召回后按域名和权威度重新打分（按次计费，条数不影响成本）。
 */
export function buildCorpusQuery(word: string): string {
  const term = sanitizeCorpusTerm(word);
  if (!term) return '';

  const base = `「${term}」 例文`;
  if (base.length <= CORPUS_QUERY_LIMIT) return base;

  // 极端长词：宁可截断检索词，也不要把 query 撑爆后被接口直接拒绝。
  const budget = CORPUS_QUERY_LIMIT - '「」 例文'.length;
  return `「${term.slice(0, Math.max(1, budget))}」 例文`;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function referenceBonus(hostname: string): number {
  for (const [domain, bonus] of Object.entries(REFERENCE_DOMAINS)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) return bonus;
  }
  return hostname.endsWith('.jp') ? 2 : 0;
}

/**
 * 给搜索结果重新排序。
 * rerank_score 与 authority 是官方给的质量信号，但都很粗；域名白名单补上「这是不是
 * 一个能当例句出处的站」这一层判断。
 */
export function rankCorpusHits(hits: CorpusSearchHit[], limit = 6): CorpusSearchHit[] {
  const scored = hits
    .map((hit) => {
      const hostname = hostnameOf(hit.url);
      // 没有任何可喂给模型的正文，留着只会让归纳环节空转。
      const text = hit.summary || hit.snippet;
      const score =
        hit.rerankScore * 3
        + (hit.authority >= 0 ? hit.authority * 2 : 0)
        + referenceBonus(hostname)
        // 完全没有质量信号时（rerank 和 authority 都是默认 0），别让它冒充可信来源
        + (hit.rerankScore > 0 || hit.authority > 0 || referenceBonus(hostname) > 0 ? 0 : -2);
      return { hit, score, text };
    })
    .filter(({ text }) => text.length >= 40)
    .sort((left, right) => right.score - left.score);

  // 去重：同一个 URL 被搜索引擎返回多次没有意义。
  const seen = new Set<string>();
  const ranked: CorpusSearchHit[] = [];
  for (const { hit } of scored) {
    const key = hit.url.replace(/[#?].*$/, '');
    if (seen.has(key)) continue;
    seen.add(key);
    ranked.push(hit);
    if (ranked.length >= limit) break;
  }
  return ranked;
}
