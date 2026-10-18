import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { buildCorpusQuery, rankCorpusHits, sanitizeCorpusTerm } from '../app/lib/corpusQuery';
import { buildCorpusMaterials, buildCorpusSources, parseCorpusResponse } from '../app/lib/corpusPrompt';
import type { CorpusSearchHit } from '../app/api/_utils/deepseekTools';
import { GET as corpusAvailability, POST as corpusLookup } from '../app/api/corpus/route';

function makeHit(overrides: Partial<CorpusSearchHit> = {}): CorpusSearchHit {
  return {
    title: '例文',
    url: 'https://www.weblio.jp/content/test',
    siteName: 'weblio',
    snippet: '短い説明',
    summary: 'あ'.repeat(80),
    date: null,
    rerankScore: 1,
    authority: 2,
    ...overrides,
  };
}

function testQueryBuilding() {
  assert.equal(buildCorpusQuery('読む'), '「読む」 例文');
  // 引号、括号会把检索词切碎，构造前必须清掉
  assert.equal(buildCorpusQuery('「本」'), '「本」 例文');
  assert.equal(sanitizeCorpusTerm('  （読む） '), '読む');
  assert.equal(buildCorpusQuery('   '), '');
  // 超长词不能把 query 撑过接口上限
  assert.ok(buildCorpusQuery('あ'.repeat(80)).length <= 128);
}

function testRanking() {
  const tooShort = makeHit({ url: 'https://example.com/short', summary: '', snippet: '短すぎる' });
  const unknownQuality = makeHit({ url: 'https://blog.example.com/post', rerankScore: 0, authority: -1 });
  const reference = makeHit({ url: 'https://www.weblio.jp/content/読む', rerankScore: 1.2, authority: 1 });
  const duplicate = makeHit({ url: 'https://www.weblio.jp/content/読む#example', rerankScore: 0.5, authority: 0 });

  const ranked = rankCorpusHits([tooShort, unknownQuality, duplicate, reference]);
  // 正文太短的不该喂给模型
  assert.ok(!ranked.some((hit) => hit.url === tooShort.url));
  // 词典站排在只有模糊信号的结果前面
  assert.equal(ranked[0].url, reference.url);
  // 同一页面（忽略锚点）只保留一条
  assert.equal(ranked.filter((hit) => hit.url.startsWith('https://www.weblio.jp/content/読む')).length, 1);
}

function testParsing() {
  const materials = [{
    index: 0,
    site: 'weblio.jp',
    title: '読む の例文',
    text: '電車で新聞を読んだ。彼は毎朝新聞を読む。',
  }];
  const sources = [{ title: '読む の例文', url: 'https://www.weblio.jp/content/読む', site: 'weblio.jp' }];

  const grounded = parseCorpusResponse(
    JSON.stringify({
      examples: [{ ja: '電車で新聞を読んだ。', translation: '在电车上读了报纸。', sourceIndex: 0 }],
      registers: ['书面'],
      note: '偏书面语',
    }),
    materials,
    sources
  );
  assert.equal(grounded.examples.length, 1);
  assert.equal(grounded.examples[0].ja, '電車で新聞を読んだ。');
  assert.deepEqual(grounded.registers, ['书面']);

  // 模型凭空造的例句必须被挡掉——这条是这个功能存在的理由
  const invented = parseCorpusResponse(
    JSON.stringify({
      examples: [{ ja: '私は昨日ラーメンを食べた。', translation: '我昨天吃了拉面。', sourceIndex: 0 }],
      registers: ['口语'],
      note: '日常会话',
    }),
    materials,
    sources
  );
  assert.equal(invented.examples.length, 0);
  // 没有例句时不要留下孤立的语域标签和提醒
  assert.deepEqual(invented.registers, []);
  assert.equal(invented.note, '');

  // 越界的 sourceIndex 不能指向不存在的来源
  const outOfRange = parseCorpusResponse(
    JSON.stringify({
      examples: [{ ja: '電車で新聞を読んだ。', translation: 'x', sourceIndex: 5 }],
      registers: [],
      note: '',
    }),
    materials,
    sources
  );
  assert.equal(outOfRange.examples.length, 0);

  // 模型偶尔会用代码块包 JSON
  const fenced = parseCorpusResponse(
    '```json\n{"examples":[{"ja":"毎朝新聞を読む。","translation":"每天早上读报纸。","sourceIndex":0}],"registers":[],"note":""}\n```',
    materials,
    sources
  );
  assert.equal(fenced.examples.length, 1);
  assert.equal(fenced.examples[0].ja, '毎朝新聞を読む。');
}

async function testRoute() {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.DEEPSEEK_API_KEY;
  const originalToolsUrl = process.env.DEEPSEEK_TOOLS_API_URL;
  process.env.DEEPSEEK_TOOLS_API_URL = 'https://api.deepseek.com';

  try {
    delete process.env.DEEPSEEK_API_KEY;

    const noKey = await corpusLookup(new NextRequest('http://localhost/api/corpus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer chat-key' },
      body: JSON.stringify({ word: '読む', provider: 'deepseek' }),
    }));
    assert.equal(noKey.status, 400, '没有搜索 Key 时必须拒绝，而不是悄悄消耗别的额度');
    assert.equal((await noKey.json()).error.code, 'CORPUS_NOT_CONFIGURED');

    const availability = await corpusAvailability(new NextRequest('http://localhost/api/corpus'));
    assert.equal(availability.status, 200);
    assert.equal((await availability.json()).available, false);

    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('/v1/tools/search')) {
        return Response.json({
          results: [{
            title: '読む の例文',
            url: 'https://www.weblio.jp/content/読む',
            snippet: '電車で新聞を読んだ。',
            summary: '電車で新聞を読んだ。彼は毎朝新聞を読む。' + 'あ'.repeat(40),
            site_name: 'weblio',
            date: null,
            rerank_score: 2.5,
            authority: 3,
          }],
        });
      }
      return Response.json({
        choices: [{
          message: {
            content: JSON.stringify({
              examples: [{ ja: '電車で新聞を読んだ。', translation: '在电车上读了报纸。', sourceIndex: 0 }],
              registers: ['常体'],
              note: '',
            }),
          },
        }],
      });
    };

    const buildRequest = () => new NextRequest('http://localhost/api/corpus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer chat-key',
        'X-Search-Api-Key': 'search-key',
        'X-App-Locale': 'zh-CN',
      },
      body: JSON.stringify({ word: '読む', sentence: '本を読んだ。', provider: 'deepseek' }),
    });

    const response = await corpusLookup(buildRequest());
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.examples.length, 1);
    assert.equal(body.examples[0].ja, '電車で新聞を読んだ。');
    assert.equal(body.sources[0].site, 'weblio');
    assert.equal(calls.length, 2, '搜索一次 + 归纳一次');
    assert.ok(calls[0].includes('/v1/tools/search'));
    assert.ok(calls[1].includes('/chat/completions'));

    // 同一个词再问一次应该命中服务端缓存，不再花钱
    const cached = await corpusLookup(buildRequest());
    assert.equal(cached.status, 200);
    assert.equal(calls.length, 2, '重复查询命中缓存，不应再次调用');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = originalKey;
    if (originalToolsUrl === undefined) delete process.env.DEEPSEEK_TOOLS_API_URL;
    else process.env.DEEPSEEK_TOOLS_API_URL = originalToolsUrl;
  }
}

export async function runCorpusTests() {
  testQueryBuilding();
  testRanking();
  testParsing();
  await testRoute();

  // 材料构造只依赖 summary/snippet，且必须截断，避免一条长网页吃掉整次归纳的预算
  const materials = buildCorpusMaterials([makeHit({ summary: 'あ'.repeat(2000), snippet: '' })]);
  assert.equal(materials.length, 1);
  assert.equal(materials[0].text.length, 700);
  const sources = buildCorpusSources([makeHit({ title: 'T', url: 'https://example.com/x', siteName: 'example' })]);
  assert.deepEqual(sources[0], { title: 'T', url: 'https://example.com/x', site: 'example' });

  console.log('corpus tests passed');
}
