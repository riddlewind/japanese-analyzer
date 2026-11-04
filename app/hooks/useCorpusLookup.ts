'use client';

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getCorpusAvailability,
  lookupCorpus,
  type AIModelName,
  type AIProvider,
  type CorpusLookupResult,
} from '../services/api';

export type CorpusLookupState = 'idle' | 'loading' | 'done' | 'error';

interface UseCorpusLookupOptions {
  /** 当前词详情的原词；为空表示没有选中词 */
  word: string;
  sentence?: string;
  pos?: string;
  userApiKey?: string;
  aiProvider: AIProvider;
  aiModel: AIModelName;
  /** 用户自己的 DeepSeek Key；为空时用服务端配置 */
  searchApiKey?: string;
}

/**
 * 真实语料检索的状态机。
 * 故意做成手动触发：每次检索都花一次 Search 调用，自动触发等于替用户刷卡。
 */
export function useCorpusLookup({
  word,
  sentence,
  pos,
  userApiKey,
  aiProvider,
  aiModel,
  searchApiKey,
}: UseCorpusLookupOptions) {
  const { t, locale } = useLanguage();
  const [available, setAvailable] = useState(false);
  const [state, setState] = useState<CorpusLookupState>('idle');
  const [result, setResult] = useState<CorpusLookupResult | null>(null);
  const [error, setError] = useState('');
  const cacheRef = useRef(new Map<string, CorpusLookupResult>());
  const activeRef = useRef<{ word: string; controller: AbortController } | null>(null);

  useEffect(() => {
    if (searchApiKey) {
      setAvailable(true);
      return;
    }
    let cancelled = false;
    void getCorpusAvailability().then((serverAvailable) => {
      if (!cancelled) setAvailable(serverAvailable);
    });
    return () => { cancelled = true; };
  }, [searchApiKey]);

  // 换词、换句、换语言都要清场：旧词的语料挂在新词下面只会误导。
  useEffect(() => {
    activeRef.current?.controller.abort();
    activeRef.current = null;
    setState('idle');
    setResult(null);
    setError('');
  }, [word, sentence, pos, locale]);

  useEffect(() => () => { activeRef.current?.controller.abort(); }, []);

  const lookup = useCallback(async () => {
    const target = word.trim();
    if (!target) return;

    // 缓存键要带语言：换语言后译文也得跟着换。
    const cacheKey = `${locale}|${target}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      activeRef.current?.controller.abort();
      activeRef.current = null;
      setResult(cached);
      setState('done');
      setError('');
      return;
    }

    activeRef.current?.controller.abort();
    const controller = new AbortController();
    activeRef.current = { word: target, controller };
    setState('loading');
    setError('');
    setResult(null);

    try {
      const data = await lookupCorpus(target, userApiKey, aiProvider, aiModel, {
        sentence,
        pos,
        searchApiKey,
        signal: controller.signal,
      });
      if (controller.signal.aborted || activeRef.current?.controller !== controller) return;
      cacheRef.current.set(cacheKey, data);
      if (cacheRef.current.size > 100) {
        const oldest = cacheRef.current.keys().next().value;
        if (oldest !== undefined) cacheRef.current.delete(oldest);
      }
      setResult(data);
      setState('done');
      activeRef.current = null;
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error && err.message ? err.message : t('检索真实语料失败'));
      setState('error');
      activeRef.current = null;
    }
  }, [word, sentence, pos, userApiKey, aiProvider, aiModel, searchApiKey, locale, t]);

  return { available, state, result, error, lookup };
}
