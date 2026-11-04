// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

/**
 * 为源码文件补 SPDX 许可标识与版权行。
 *
 * 依 AGPL-3.0 §5(a)，分发修改版时源文件应带有显著的改动声明。本项目的改动记录以
 * Git 历史为准，源文件统一携带 SPDX 标识，避免单个文件脱离仓库后授权不明。
 *
 * 用法：
 *   node scripts/add-spdx-headers.mjs          写入缺失的头部
 *   node scripts/add-spdx-headers.mjs --check  只报告缺失，不写文件
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const HEADER = [
  '// SPDX-License-Identifier: AGPL-3.0-only',
  '// Copyright (C) 2025-2026 Howen and contributors',
].join('\n');

const TARGET_DIRS = ['app', 'components', 'lib', 'tests', 'scripts'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.mjs', '.js']);
const SKIP = new Set(['next-env.d.ts']);

const DIRECTIVE = /^(?:\s*\/\/.*\n|\s*\/\*[\s\S]*?\*\/\s*\n)*(['"])use (client|server)\1;?[^\n]*\n/;

function walk(dir) {
  const absolute = path.join(root, dir);
  const out = [];
  if (!statSync(absolute).isDirectory()) return out;
  for (const name of readdirSync(absolute)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const relative = path.join(dir, name);
    const stats = statSync(path.join(root, relative));
    if (stats.isDirectory()) out.push(...walk(relative));
    else if (EXTENSIONS.has(path.extname(name)) && !SKIP.has(name)) out.push(relative);
  }
  return out;
}

/** 头部插入位置：文件开头的指令（'use client' 等）之后，避免破坏指令语义。 */
function insertAt(source) {
  const match = source.match(DIRECTIVE);
  if (match) return [match[0], source.slice(match[0].length)];
  return ['', source];
}

const checkOnly = process.argv.includes('--check');
const missing = [];

for (const file of TARGET_DIRS.flatMap(walk)) {
  const source = readFileSync(path.join(root, file), 'utf8');
  if (source.includes('SPDX-License-Identifier')) continue;
  missing.push(file);
  if (checkOnly) continue;
  const [prefix, rest] = insertAt(source);
  const body = prefix ? `${prefix}\n${HEADER}\n\n${rest.replace(/^\n+/, '')}` : `${HEADER}\n\n${source}`;
  writeFileSync(path.join(root, file), body, 'utf8');
}

if (missing.length === 0) {
  console.log('所有源码文件均已带 SPDX 标识。');
} else if (checkOnly) {
  console.error(`以下 ${missing.length} 个文件缺少 SPDX 标识：`);
  for (const file of missing) console.error(`  - ${file}`);
  process.exit(1);
} else {
  console.log(`已为 ${missing.length} 个文件补上 SPDX 标识。`);
}
