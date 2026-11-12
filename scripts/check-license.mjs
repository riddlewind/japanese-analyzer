// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

/**
 * AGPL-3.0 合规自检。
 *
 * 覆盖三类容易在改动中悄悄失效的义务：
 *   1. 声明文件齐全（§4/§5：许可与版权声明必须随分发保留）
 *   2. 网络交互提示（§13：/legal 入口必须存在且从界面可达）
 *   3. 目标代码分发的源码要约（§6：Docker 镜像必须带上声明与 SOURCE）
 *
 * 用法：node scripts/check-license.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const warnings = [];

function read(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) {
    failures.push(`缺少文件 / missing file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

// 1. 声明文件
const license = read('LICENSE');
expect(
  license.includes('GNU AFFERO GENERAL PUBLIC LICENSE') && license.includes('Version 3, 19 November 2007'),
  'LICENSE 不是 AGPL-3.0 正文 / LICENSE is not the AGPL-3.0 text',
);

const notice = read('NOTICE');
expect(notice.includes('Copyright'), 'NOTICE 缺少版权声明 / NOTICE has no copyright line');
expect(/AGPL-3\.0-only/.test(notice), 'NOTICE 未声明 AGPL-3.0-only');

const licensing = read('LICENSING.md');
expect(licensing.includes('MIT-legacy'), 'LICENSING.md 未说明历史 MIT 材料');
expect(/§13|第 13 条|section 13/i.test(licensing), 'LICENSING.md 未说明第 13 条义务');

read('LICENSES/MIT-legacy.txt');
const sourceOffer = read('SOURCE');
expect(/section 6|第 6 条/i.test(sourceOffer), 'SOURCE 未声明第 6 条书面要约');
expect(/three years|三年/.test(sourceOffer), 'SOURCE 未写明要约有效期');

// 2. 包元数据与第三方声明
const pkg = JSON.parse(read('package.json') || '{}');
expect(pkg.license === 'AGPL-3.0-only', `package.json license 应为 AGPL-3.0-only，当前为 ${pkg.license}`);

const thirdParty = read('THIRD-PARTY-NOTICES.md');
expect(thirdParty.includes('SIL OPEN FONT LICENSE'), 'THIRD-PARTY-NOTICES.md 未附字体 OFL 正文');
expect(thirdParty.includes('@fontsource/noto-sans-jp'), 'THIRD-PARTY-NOTICES.md 未列出 Noto Sans JP');

// 3. 网络交互入口（§13）
const legalPage = read('app/legal/page.tsx');
expect(/Corresponding Source/.test(legalPage), '/legal 页面未提供对应源码入口');
expect(license.length > 0 && legalPage.includes('readRepoFile'), '/legal 页面未内联许可证正文');
expect(
  legalPage.includes('THIRD-PARTY-NOTICES.md'),
  '/legal 页面未提供第三方声明（含字体 OFL 正文）',
);

// 声明文件必须在部署产物里：serverless / standalone 只带被 trace 到的文件，
// 漏配会让 /legal 读到回退文案，等于第三方声明没有随分发提供。
const nextConfig = read('next.config.ts');
const tracing = nextConfig.match(/outputFileTracingIncludes:[\s\S]*?\n  \},/);
expect(Boolean(tracing), 'next.config.ts 缺少 outputFileTracingIncludes，声明文件可能不随产物打包');
if (tracing) {
  for (const file of ['LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.md']) {
    expect(tracing[0].includes(file), `outputFileTracingIncludes 漏了 ${file}，/legal 会读到回退文案`);
  }
}

const legalConfig = read('app/legal/config.ts');
expect(/SOURCE_URL/.test(legalConfig), '/legal 未暴露可配置的源码地址');
expect(/NEXT_PUBLIC_SOURCE_URL/.test(legalConfig), '/legal 未保留构建期源码地址回退');
expect(/process\.env\.SOURCE_URL/.test(legalConfig), '/legal 未支持运行时覆盖源码地址');

const footerHost = read('app/page.tsx');
expect(footerHost.includes('href="/legal"'), '首页页脚缺少 /legal 入口（§13 显著提示）');

const header = read('app/components/Header.tsx');
expect(header.includes('href="/legal"'), '顶栏缺少 /legal 入口');

// 4. Docker 镜像内的声明文件
const dockerfile = read('Dockerfile');
for (const file of ['LICENSE', 'NOTICE', 'LICENSING.md', 'LICENSES', 'THIRD-PARTY-NOTICES.md', 'SOURCE']) {
  expect(dockerfile.includes(file), `Dockerfile 未把 ${file} 复制进运行镜像`);
}

// runner 是独立构建阶段，不重新声明 ARG 就拿不到 builder 的值，
// 那样运行时只能依赖构建期内联，`-e SOURCE_URL=` 覆盖会失效。
const runnerStage = dockerfile.slice(dockerfile.indexOf('AS runner'));
expect(/ARG SOURCE_URL/.test(runnerStage), 'Dockerfile runner 阶段未重新声明 SOURCE_URL，运行时无法覆盖源码地址');
expect(/ARG SOURCE_VERSION/.test(runnerStage), 'Dockerfile runner 阶段未重新声明 SOURCE_VERSION');

// 5. 上游许可基线（上游改协议后，合并新代码前必须有人确认）
read('.github/workflows/upstream-license-watch.yml');
read('.github/upstream-license-issue.md');
const baselineRaw = read('.github/upstream-license-baseline.json');
try {
  const baseline = JSON.parse(baselineRaw || '{}');
  expect(
    typeof baseline.licenseSha256 === 'string' && baseline.licenseSha256.length === 64,
    '上游许可基线缺少 licenseSha256（定时检查将无法比对 LICENSE 正文）',
  );
  expect(
    typeof baseline.licenseField === 'string' && baseline.licenseField.length > 0,
    '上游许可基线缺少 licenseField',
  );
  expect(
    baseline.licenseField === pkg.license,
    `上游许可基线的 licenseField（${baseline.licenseField}）与 package.json 的 license（${pkg.license}）不一致；若是有意变更许可，请同步更新基线，否则定时检查会持续告警`,
  );
} catch {
  failures.push('.github/upstream-license-baseline.json 不是合法的 JSON');
}

// 6. 提示性检查（不阻断）
const envExample = read('.env.example');
if (!envExample.includes('NEXT_PUBLIC_SOURCE_URL')) {
  warnings.push('.env.example 未说明 NEXT_PUBLIC_SOURCE_URL，部署方可能漏配源码地址');
}

if (warnings.length > 0) {
  for (const warning of warnings) console.warn(`警告 / warning: ${warning}`);
}

if (failures.length > 0) {
  console.error(`\nAGPL-3.0 合规自检未通过（${failures.length} 项）：`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('AGPL-3.0 合规自检通过：声明文件、/legal 入口、镜像声明与第三方清单均在位。');
