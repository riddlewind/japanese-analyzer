// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

/** 语料检索的共享类型：服务端产出、前端渲染都用这一份。 */

export interface CorpusExample {
  /** 真实出现的日语句子 */
  ja: string;
  /** 目标语言译文 */
  translation: string;
  /** 指向 sources 的下标 */
  sourceIndex: number;
}

export interface CorpusSource {
  title: string;
  url: string;
  site: string;
}

export interface CorpusLookupResult {
  examples: CorpusExample[];
  /** 语域标签，如「书面」「口语」「敬语」 */
  registers: string[];
  /** 使用场合提醒，可为空 */
  note: string;
  sources: CorpusSource[];
}

export function createEmptyCorpusResult(): CorpusLookupResult {
  return { examples: [], registers: [], note: '', sources: [] };
}
