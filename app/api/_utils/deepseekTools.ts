import { createUpstreamTimeoutController, isUpstreamTimeoutError } from './requestTimeout';

/**
 * DeepSeek 自研搜索 / 抓取接口。
 * 与 chat/completions 不同，这里是原生 JSON，不能走 openaiProxy。
 * 文档：POST /v1/tools/search、POST /v1/tools/fetch，按成功次数计费。
 */

export const CORPUS_SEARCH_TIMEOUT_MS = 12_000;
export const CORPUS_QUERY_LIMIT = 128;

export interface CorpusSearchHit {
  title: string;
  url: string;
  siteName: string;
  snippet: string;
  summary: string;
  date: string | null;
  rerankScore: number;
  authority: number;
}

export type SearchToolErrorCode = 'unauthorized' | 'rate_limited' | 'timeout' | 'upstream';

export class SearchToolError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: SearchToolErrorCode
  ) {
    super(message);
    this.name = 'SearchToolError';
  }
}

function getToolsBaseUrl(): string {
  const configured = process.env.DEEPSEEK_TOOLS_API_URL?.trim();
  return (configured || 'https://api.deepseek.com').replace(/\/+$/, '');
}

function readString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function readNumber(source: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toHit(raw: Record<string, unknown>): CorpusSearchHit | null {
  const url = readString(raw, 'url', 'link');
  if (!url) return null;

  let siteName = readString(raw, 'site_name', 'siteName');
  if (!siteName) {
    try {
      siteName = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      siteName = '';
    }
  }

  const date = readString(raw, 'date', 'published_at', 'publishedAt');

  return {
    title: readString(raw, 'title'),
    url,
    siteName,
    snippet: readString(raw, 'snippet', 'description'),
    summary: readString(raw, 'summary'),
    date: date || null,
    rerankScore: readNumber(raw, 'rerank_score', 'rerankScore'),
    // -1 表示未知，保留原值让排序逻辑自己决定要不要用。
    authority: Object.prototype.hasOwnProperty.call(raw, 'authority')
      ? readNumber(raw, 'authority')
      : -1,
  };
}

function parseErrorCode(status: number): SearchToolErrorCode {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  return 'upstream';
}

/**
 * 调用 DeepSeek Search。返回按模型可用性原样返回的命中有序列表。
 * 空结果不是错误：调用方按「没找到」处理，且这次调用不计费。
 */
export async function searchJapaneseCorpus(options: {
  query: string;
  apiKey: string;
  count?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<CorpusSearchHit[]> {
  const query = options.query.trim().slice(0, CORPUS_QUERY_LIMIT);
  if (!query) return [];

  const timeout = createUpstreamTimeoutController(options.timeoutMs ?? CORPUS_SEARCH_TIMEOUT_MS);
  const signals = [options.signal, timeout.controller.signal]
    .filter((signal): signal is AbortSignal => Boolean(signal));
  const signal = signals.length > 1 ? AbortSignal.any(signals) : signals[0];
  const count = Math.min(20, Math.max(1, options.count ?? 8));

  let response: Response;
  try {
    response = await fetch(`${getToolsBaseUrl()}/v1/tools/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      // need_content 保持 false：summary 已经够模型读，抓全文只会让 token 账单变厚。
      body: JSON.stringify({ query, count, need_content: false }),
      signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (isUpstreamTimeoutError(error)) {
      throw new SearchToolError('搜索接口请求超时，请稍后重试。', 504, 'timeout');
    }
    throw new SearchToolError('无法连接搜索接口。', 502, 'upstream');
  } finally {
    timeout.clear();
  }

  if (!response.ok) {
    throw new SearchToolError(
      response.status === 401 || response.status === 403
        ? '搜索接口鉴权失败，请检查 DeepSeek API Key 是否有效。'
        : response.status === 429
          ? '搜索请求过于频繁，请稍后再试。'
          : `搜索接口返回错误（HTTP ${response.status}）。`,
      response.status === 429 ? 429 : 502,
      parseErrorCode(response.status)
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SearchToolError('搜索接口返回了无法解析的内容。', 502, 'upstream');
  }

  const rows = isRecord(payload) && Array.isArray(payload.results) ? payload.results : [];
  return rows
    .filter(isRecord)
    .map(toHit)
    .filter((hit): hit is CorpusSearchHit => hit !== null);
}
