// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

import { NextRequest, NextResponse } from 'next/server';
import { readJsonBody, requestBodyErrorResponse } from '../_utils/requestBody';
import { normalizeLocale } from '../../i18n';
import { proxyOpenAICompatibleRequest } from '../_utils/openaiProxy';
import { ProviderConfigError, resolveProviderConfig, withProviderControls } from '../_utils/providerConfig';
import { isUpstreamTimeoutError } from '../_utils/requestTimeout';
import { requireApiSession } from '../_utils/sessionAuth';
import { createLoginRateLimiter } from '../_utils/loginRateLimit';
import { SearchToolError, searchJapaneseCorpus, type CorpusSearchHit } from '../_utils/deepseekTools';
import { buildCorpusQuery, rankCorpusHits } from '../../lib/corpusQuery';
import {
  buildCorpusMaterials,
  buildCorpusSources,
  getCorpusSystemPrompt,
  parseCorpusResponse,
} from '../../lib/corpusPrompt';
import { createEmptyCorpusResult, type CorpusLookupResult } from '../../lib/corpusTypes';

// 搜索 + 归纳两个上游串行，别让平台默认超时把中间结果掐掉。
export const maxDuration = 60;

/**
 * [已关闭] DeepSeek Search / Fetch 接口不再对外开放。
 * 这里保留完整实现，只把入口挡住：要恢复功能，把 CORPUS_API_DISABLED 改成 false，
 * 并解注释 app/page.tsx 里标注 [已关闭] 的片段即可。
 */
const CORPUS_API_DISABLED = true;

const CORPUS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
// 没查到例句的结果短存：用户换个词或过一会儿重试时不该被旧空结果挡住。
const CORPUS_EMPTY_CACHE_TTL_MS = 10 * 60 * 1000;
const CORPUS_CACHE_LIMIT = 300;
const MAX_WORD_LENGTH = 60;

// 语料检索按次计费（Search 0.005 元/次），公开部署必须限量。
// 与登录限流共用同一套计数器：CODE 是共享账号，按来源 IP 区分在这里没有意义。
const reserveCorpusLookup = createLoginRateLimiter(20, 60_000);

interface CacheEntry {
  value: CorpusLookupResult;
  expiresAt: number;
}

const corpusCache = new Map<string, CacheEntry>();

function readCache(key: string): CorpusLookupResult | null {
  const entry = corpusCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    corpusCache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key: string, value: CorpusLookupResult): void {
  const ttl = value.examples.length > 0 ? CORPUS_CACHE_TTL_MS : CORPUS_EMPTY_CACHE_TTL_MS;
  corpusCache.set(key, { value, expiresAt: Date.now() + ttl });
  // Map 保持插入顺序，超限就从最旧的一条开始丢。
  while (corpusCache.size > CORPUS_CACHE_LIMIT) {
    const oldest = corpusCache.keys().next().value;
    if (oldest === undefined) break;
    corpusCache.delete(oldest);
  }
}

function getSearchApiKey(req: NextRequest): string {
  // 用户自带 Key 优先：这样没配服务端 DEEPSEEK_API_KEY 的部署也能用自己的额度。
  const clientKey = req.headers.get('X-Search-Api-Key')?.trim();
  if (clientKey) return clientKey;
  return process.env.DEEPSEEK_API_KEY?.trim() || '';
}

/** 前端用它决定要不要显示「查真实语料」入口。 */
export async function GET(req: NextRequest) {
  if (CORPUS_API_DISABLED) return NextResponse.json({ available: false });

  const authError = requireApiSession(req);
  if (authError) return authError;

  const serverKey = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
  return NextResponse.json({ available: serverKey });
}

export async function POST(req: NextRequest) {
  if (CORPUS_API_DISABLED) {
    return NextResponse.json(
      { error: { message: '语料检索功能已关闭。', code: 'CORPUS_DISABLED' } },
      { status: 403 }
    );
  }

  try {
    const locale = normalizeLocale(req.headers.get('X-App-Locale'));
    const authError = requireApiSession(req);
    if (authError) return authError;

    const searchApiKey = getSearchApiKey(req);
    if (!searchApiKey) {
      return NextResponse.json(
        {
          error: {
            message: '未配置 DeepSeek API Key，无法检索真实语料。',
            code: 'CORPUS_NOT_CONFIGURED',
          },
        },
        { status: 400 }
      );
    }

    const retryAfter = reserveCorpusLookup();
    if (retryAfter > 0) {
      return NextResponse.json(
        { error: { message: `检索请求过于频繁，请 ${retryAfter} 秒后再试。`, code: 'CORPUS_RATE_LIMITED' } },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const body = await readJsonBody(req);
    const word = typeof body.word === 'string' ? body.word.trim().slice(0, MAX_WORD_LENGTH) : '';
    const sentence = typeof body.sentence === 'string' ? body.sentence.trim().slice(0, 300) : '';
    const pos = typeof body.pos === 'string' ? body.pos.trim().slice(0, 40) : '';

    if (!word) {
      return NextResponse.json(
        { error: { message: '缺少必要的参数', code: 'CORPUS_BAD_REQUEST' } },
        { status: 400 }
      );
    }

    const query = buildCorpusQuery(word);
    if (!query) {
      return NextResponse.json(
        { error: { message: '这个词无法用于检索', code: 'CORPUS_BAD_REQUEST' } },
        { status: 400 }
      );
    }

    // 命中缓存不该再花钱，但仍然占用一次配额——否则连点同一个词就能绕开限流。
    const cacheKey = `${locale}|${word}`;
    const cached = readCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    let hits: CorpusSearchHit[];
    try {
      hits = await searchJapaneseCorpus({
        query,
        apiKey: searchApiKey,
        count: 8,
        signal: req.signal,
      });
    } catch (error) {
      if (error instanceof SearchToolError) {
        return NextResponse.json(
          { error: { message: error.message, code: `CORPUS_${error.code.toUpperCase()}` } },
          { status: error.status === 429 ? 429 : error.status === 504 ? 504 : 502 }
        );
      }
      throw error;
    }

    const ranked = rankCorpusHits(hits);
    if (ranked.length === 0) {
      const empty = createEmptyCorpusResult();
      writeCache(cacheKey, empty);
      return NextResponse.json(empty);
    }

    const materials = buildCorpusMaterials(ranked);
    const sources = buildCorpusSources(ranked);

    const providerConfig = resolveProviderConfig(req, { provider: body.provider, model: body.model });
    if (!providerConfig.apiKey) {
      return NextResponse.json(
        { error: { message: '未提供API密钥，请在设置中配置API密钥或联系管理员配置服务器密钥' } },
        { status: 500 }
      );
    }

    const payload = withProviderControls(providerConfig.provider, {
      model: providerConfig.model,
      messages: [
        { role: 'system', content: getCorpusSystemPrompt(locale) },
        { role: 'user', content: JSON.stringify({ word, sentence, pos, materials }) },
      ],
      stream: false,
    }, { structuredOutput: 'corpusExamples' });

    const proxied = await proxyOpenAICompatibleRequest({
      url: providerConfig.apiUrl,
      apiKey: providerConfig.apiKey,
      payload,
      signal: req.signal,
    });

    if (!proxied.ok) {
      console.error('AI API error (Corpus):', proxied.error.raw ?? proxied.error.message);
      return NextResponse.json(
        { error: { message: proxied.error.message } },
        { status: proxied.status }
      );
    }

    const completion: unknown = await proxied.response.json();
    const content = typeof completion === 'object' && completion !== null
      && Array.isArray((completion as Record<string, unknown>).choices)
      ? ((completion as { choices: { message?: { content?: unknown } }[] }).choices[0]?.message?.content)
      : undefined;

    if (typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: { message: '语料归纳没有返回内容，请重试。' } },
        { status: 502 }
      );
    }

    const result = parseCorpusResponse(content, materials, sources);
    writeCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    const bodyError = requestBodyErrorResponse(error);
    if (bodyError) return bodyError;

    if (error instanceof ProviderConfigError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.status });
    }

    if (req.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      return new Response(null, { status: 499 });
    }

    if (isUpstreamTimeoutError(error)) {
      return NextResponse.json(
        { error: { message: '语料检索超时，请稍后重试。' } },
        { status: 504 }
      );
    }

    console.error('Server error (Corpus):', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : '服务器错误' } },
      { status: 500 }
    );
  }
}
