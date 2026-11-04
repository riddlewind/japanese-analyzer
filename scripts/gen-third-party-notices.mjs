// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

/**
 * 生成 THIRD-PARTY-NOTICES.md。
 *
 * AGPL-3.0 并不取消第三方组件的许可义务：分发本项目（尤其是 Docker 镜像或静态产物）时
 * 仍需保留这些组件的版权与许可声明。字体（OFL-1.1）要求随分发一并提供许可证正文，
 * 因此本脚本会把实际打包进前端的字体许可证原文嵌入清单。
 *
 * 用法：node scripts/gen-third-party-notices.mjs [--check]
 *   --check  只校验清单是否与当前依赖一致，不写文件（CI 用）
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const outputPath = path.join(root, 'THIRD-PARTY-NOTICES.md');

/** 需要逐字附上许可证正文的组件（字体文件会被直接提供给浏览器）。 */
const EMBEDDED_LICENSE_PACKAGES = [
  '@fontsource/noto-sans-jp',
  '@fontsource/jetbrains-mono',
];

/**
 * package.json 未声明 license 字段、但包内文本可确认授权的组件。
 * 依据写在 evidence 中，生成清单时一并输出，避免"许可证不明"被静默忽略。
 */
const MANUAL_LICENSES = {
  format: {
    license: 'MIT',
    evidence: 'format.js 文件头：Copyright 2010-2013 Sami Samhuri, MIT License',
  },
  khroma: {
    license: 'MIT',
    evidence: '包内 license 文件：The MIT License, Copyright (c) 2019-present Fabio Spampinato, Andrew Maney',
  },
};

/** 需要额外说明的许可证。 */
const LICENSE_NOTES = {  'LGPL-3.0-or-later':
    'LGPL-3.0-or-later：以动态加载的原生模块形式使用，未修改其源码。对应源码可从上游包获取；如需自行替换/重链接，' +
    '可在同一镜像内替换该模块而不影响本程序的其余部分。',
  'CC-BY-4.0': 'CC-BY-4.0：数据类组件，保留署名即可使用。',
  'MPL-2.0': 'MPL-2.0：未修改其源码时按原样分发。',
  'MPL-2.0 OR Apache-2.0': 'MPL-2.0 或 Apache-2.0（双许可），本项目按 Apache-2.0 使用。',
  'Apache-2.0 AND LGPL-3.0-or-later': 'Apache-2.0 与 LGPL-3.0-or-later 双重许可的原生二进制，见上文 LGPL 说明。',
};

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function normalizeLicense(value) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object' && typeof value.type === 'string') return value.type;
  return 'UNKNOWN';
}

function packageLicense(name, fromLock) {
  const candidate = normalizeLicense(fromLock);
  if (candidate !== 'UNKNOWN') return candidate;
  const manifest = path.join(root, 'node_modules', name, 'package.json');
  if (existsSync(manifest)) {
    const fromManifest = normalizeLicense(readJson(manifest).license);
    if (fromManifest !== 'UNKNOWN') return fromManifest;
  }
  return MANUAL_LICENSES[name]?.license ?? 'UNKNOWN';
}

function licenseTextOf(name) {
  const base = path.join(root, 'node_modules', name);
  for (const file of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'OFL.txt']) {
    const candidate = path.join(base, file);
    if (existsSync(candidate)) return readFileSync(candidate, 'utf8').trim();
  }
  return '';
}

function collect() {
  const lockPath = path.join(root, 'package-lock.json');
  if (!existsSync(lockPath)) {
    console.error('找不到 package-lock.json，无法生成第三方清单。');
    process.exit(1);
  }

  const lock = readJson(lockPath);
  const entries = Object.entries(lock.packages ?? {})
    .filter(([key, value]) => key.startsWith('node_modules/') && !value.dev && !value.link)
    .map(([key, value]) => {
      const name = value.name ?? key.replace(/^node_modules\//, '');
      return {
        name,
        version: value.version ?? '0.0.0',
        license: packageLicense(name, value.license),
      };
    });

  const deduped = new Map();
  for (const entry of entries) deduped.set(`${entry.name}@${entry.version}`, entry);
  return [...deduped.values()].sort((a, b) =>
    a.license === b.license ? a.name.localeCompare(b.name) : a.license.localeCompare(b.license),
  );
}

function render(packages) {
  const byLicense = new Map();
  for (const entry of packages) {
    if (!byLicense.has(entry.license)) byLicense.set(entry.license, []);
    byLicense.get(entry.license).push(entry);
  }

  const lines = [];
  lines.push('# 第三方组件与字体声明 / Third-party notices');
  lines.push('');
  lines.push('本文件由 `npm run notices` 从 `package-lock.json` 自动生成，请勿手工编辑。');
  lines.push('');
  lines.push('This file is generated from `package-lock.json` by `npm run notices`. Do not edit by hand.');
  lines.push('');
  lines.push('本项目整体以 AGPL-3.0-only 分发，但这不改变下列第三方组件各自的许可证。');
  lines.push('分发本项目的产物（例如 Docker 镜像、静态构建）时，需随附本文件与相应许可证正文。');
  lines.push('');
  lines.push('The project as a whole is AGPL-3.0-only; that does not change the licenses of the');
  lines.push('components listed below. Keep this file and the referenced license texts when you');
  lines.push('convey build artifacts such as Docker images or static bundles.');
  lines.push('');
  lines.push('## 概览 / Summary');
  lines.push('');
  lines.push('| 许可证 / License | 数量 / Count |');
  lines.push('| --- | --- |');
  for (const [license, group] of [...byLicense.entries()].sort()) {
    lines.push(`| ${license} | ${group.length} |`);
  }
  const notPermissive = [...byLicense.keys()].filter((license) =>
    /LGPL|MPL|CC-BY|OFL|UNKNOWN/i.test(license),
  );
  lines.push('');
  lines.push(`共 ${packages.length} 个运行时依赖。`);
  lines.push('');
  if (notPermissive.length > 0) {
    lines.push('需要额外留意的许可证 / Licenses needing attention:');
    lines.push('');
    for (const license of notPermissive.sort()) {
      lines.push(`- ${license}${LICENSE_NOTES[license] ? ` — ${LICENSE_NOTES[license]}` : ''}`);
    }
    lines.push('');
  }

  lines.push('## 组件清单 / Components');
  lines.push('');
  for (const [license, group] of [...byLicense.entries()].sort()) {
    lines.push(`### ${license}（${group.length}）`);
    lines.push('');
    for (const entry of group) {
      lines.push(`- \`${entry.name}@${entry.version}\``);
    }
    lines.push('');
  }

  const unlabelled = packages.filter((entry) => MANUAL_LICENSES[entry.name]);
  if (unlabelled.length > 0) {
    lines.push('## 许可证字段缺失、经人工核对的组件 / Packages verified by hand');
    lines.push('');
    lines.push('下列包的 `package.json` 没有 `license` 字段，授权依据取自包内文件原文：');
    lines.push('');
    for (const entry of unlabelled) {
      lines.push(`- \`${entry.name}@${entry.version}\` — ${MANUAL_LICENSES[entry.name].license}`);
      lines.push(`  - 依据 / Evidence: ${MANUAL_LICENSES[entry.name].evidence}`);
    }
    lines.push('');
  }

  lines.push('## 字体 / Fonts');
  lines.push('');
  lines.push('界面使用 Noto Sans JP 与 JetBrains Mono，两者的字库文件由本项目直接提供给浏览器。');
  lines.push('两个字体均以 SIL Open Font License 1.1 分发，许可证正文与版权声明逐字附于下文。');
  lines.push('');
  lines.push('The UI serves the Noto Sans JP and JetBrains Mono webfonts directly to browsers. Both are');
  lines.push('distributed under the SIL Open Font License 1.1; the full texts and copyright notices follow.');
  lines.push('');

  for (const name of EMBEDDED_LICENSE_PACKAGES) {
    const version = packages.find((entry) => entry.name === name)?.version;
    const text = licenseTextOf(name);
    lines.push(`### ${name}${version ? `@${version}` : ''}`);
    lines.push('');
    if (!text) {
      lines.push('_未在 node_modules 中找到许可证文件；请从包的发行版中获取 OFL 正文。_');
      lines.push('');
      continue;
    }
    lines.push('```text');
    lines.push(text);
    lines.push('```');
    lines.push('');
  }

  lines.push('## 相关文件 / Related files');
  lines.push('');
  lines.push('- `LICENSE`：本项目 AGPL-3.0 正文 / the project\'s AGPL-3.0 text');
  lines.push('- `NOTICE`：版权与来源声明 / copyright and provenance');
  lines.push('- `LICENSING.md`：许可范围与版本边界 / licensing scope');
  lines.push('- `LICENSES/MIT-legacy.txt`：历史 MIT 授权原文 / historical MIT grant');
  lines.push('- `SOURCE`：AGPL 第 6 条书面要约 / written offer of Corresponding Source');
  lines.push('');

  return `${lines.join('\n')}`;
}

const packages = collect();
const content = render(packages);
const digest = `<!-- deps:${createHash('sha256').update(JSON.stringify(packages)).digest('hex').slice(0, 16)} -->`;
const finalContent = content.replace(/^/, `${digest}\n\n`);

if (process.argv.includes('--check')) {
  const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : '';
  if (current.trim() !== finalContent.trim()) {
    console.error('THIRD-PARTY-NOTICES.md 与当前依赖不一致，请运行：npm run notices');
    process.exit(1);
  }
  console.log(`第三方声明清单已是最新（${packages.length} 个运行时依赖）。`);
} else {
  writeFileSync(outputPath, finalContent, 'utf8');
  console.log(`已写入 THIRD-PARTY-NOTICES.md（${packages.length} 个运行时依赖）。`);
}
