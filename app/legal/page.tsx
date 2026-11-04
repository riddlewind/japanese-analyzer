// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  COPYRIGHT_NOTICE,
  LICENSE_ID,
  LICENSE_NAME,
  MODIFICATION_NOTICE,
  PROJECT_NAME,
  SOURCE_IS_DEFAULT,
  SOURCE_URL,
  SOURCE_VERSION,
  UPSTREAM_SOURCE,
} from './config';

export const metadata: Metadata = {
  title: '源代码与许可证 · 日本語文章解析',
  description:
    '本程序以 GNU Affero General Public License version 3 only（AGPL-3.0-only）发布。本页提供对应源码的获取方式、版权声明与完整许可证正文。',
};

/**
 * 按请求渲染：源码地址、构建版本与修改说明来自运行时环境变量，
 * 用预构建镜像部署时无需重新构建即可把源码入口指向实际部署的仓库。
 */
export const dynamic = 'force-dynamic';

/** 在构建时读取仓库根目录下的声明文件；读取失败时回退为提示文本。 */
function readRepoFile(relativePath: string, fallback: string): string {
  try {
    return readFileSync(path.join(process.cwd(), relativePath), 'utf8').trim();
  } catch {
    return fallback;
  }
}

const licenseText = readRepoFile(
  'LICENSE',
  '未能在此构建中读取许可证正文，请从源码仓库的 LICENSE 文件获取完整文本。',
);
const noticeText = readRepoFile('NOTICE', '未能在此构建中读取 NOTICE，请从源码仓库获取。');

/**
 * 第三方清单内含字体（OFL-1.1）正文，属于随分发必须提供的声明，
 * 因此在这里内联，而不是只给一个仓库链接——离线或镜像部署时链接未必可达。
 */
const thirdPartyText = readRepoFile(
  'THIRD-PARTY-NOTICES.md',
  '未能在此构建中读取第三方声明，请从源码仓库的 THIRD-PARTY-NOTICES.md 获取。',
);

const versionLabel = SOURCE_VERSION || '未标注（以源码仓库提交历史为准）';
const sourceTreeUrl = SOURCE_VERSION ? `${SOURCE_URL}/tree/${SOURCE_VERSION}` : SOURCE_URL;

const cardStyle = {
  background: 'var(--bg-2)',
  border: '1px solid var(--line)',
};

const headingStyle = { color: 'var(--ink)' };
const bodyStyle = { color: 'var(--ink-2)' };
const mutedStyle = { color: 'var(--ink-3)' };

function SectionTitle({ zh, en }: { zh: string; en: string }) {
  return (
    <h2 className="mb-3 text-[15px] font-semibold sm:text-base" style={headingStyle}>
      {zh}
      <span className="ml-2 text-xs font-normal" style={mutedStyle}>
        {en}
      </span>
    </h2>
  );
}

export default function LegalPage() {
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--primary)]"
        style={mutedStyle}
      >
        ← 返回首页 / Back to the app
      </Link>

      <h1 className="text-2xl font-semibold sm:text-3xl" style={headingStyle}>
        源代码与许可证
      </h1>
      <p className="mt-1 text-sm" style={mutedStyle}>
        Corresponding Source and license notice
      </p>

      <p className="mt-5 text-sm leading-6" style={bodyStyle}>
        本程序是自由软件，按{' '}
        <strong style={headingStyle}>GNU Affero General Public License 第 3 版（仅第 3 版）</strong>{' '}
        发布。你通过计算机网络与本程序交互时，有权获得运行此实例所对应的源码；本页即按许可证第 13 条提供该源码的入口。
      </p>
      <p className="mt-2 text-sm leading-6" style={bodyStyle}>
        This program is free software, licensed under the GNU Affero General Public License,
        version 3 only. If you interact with it over a network, you are entitled to the
        Corresponding Source of the version running here. This page is the offer point required
        by section 13.
      </p>

      {/* 源码入口：第 13 条要求的“显著提供” */}
      <section className="mt-7 rounded-2xl p-5 sm:p-6" style={cardStyle}>
        <SectionTitle zh="获取对应源码" en="Obtain the Corresponding Source" />

        <a
          href={sourceTreeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
          style={{ background: 'var(--primary)' }}
        >
          打开源码仓库 / Open the source repository
        </a>

        <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-[128px_1fr]">
          <dt style={mutedStyle}>源码仓库 / Repository</dt>
          <dd className="break-all" style={bodyStyle}>
            <a className="underline decoration-dotted hover:text-[var(--primary)]" href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
              {SOURCE_URL}
            </a>
          </dd>

          <dt style={mutedStyle}>构建版本 / Build</dt>
          <dd style={bodyStyle}>{versionLabel}</dd>

          <dt style={mutedStyle}>许可证 / License</dt>
          <dd style={bodyStyle}>
            {LICENSE_NAME}（<code>{LICENSE_ID}</code>）
          </dd>

          <dt style={mutedStyle}>修改说明 / Modifications</dt>
          <dd style={bodyStyle}>
            {MODIFICATION_NOTICE ||
              '本部署未声明额外修改。若你运行的是修改版，运营者应在此说明修改内容，并把上方仓库地址指向该修改版的实际源码。'}
          </dd>
        </dl>

        {SOURCE_IS_DEFAULT && (
          <p className="mt-4 rounded-xl px-3 py-2 text-xs leading-5" style={{ background: 'var(--primary-soft)', color: 'var(--ink-2)' }}>
            当前源码地址取自内置默认值。若此实例是修改版，部署者必须设置
            <code className="mx-1">SOURCE_URL</code>
            指向实际部署版本的源码，否则不满足 AGPL 第 13 条。
            <br />
            Note: this page uses the built-in default repository. A modified deployment must set{' '}
            <code>SOURCE_URL</code> to its own source, otherwise section 13 is not satisfied.
          </p>
        )}

        <p className="mt-4 text-xs leading-5" style={mutedStyle}>
          源码应与本实例实际运行的版本一致，包括修改、构建与运行脚本；仅链接到不包含这些修改的上游仓库不构成对应源码。
          <br />
          The source must match the version actually served, including modifications and build
          scripts. An upstream link without your changes is not the Corresponding Source.
        </p>
      </section>

      {/* 版权 */}
      <section className="mt-5 rounded-2xl p-5 sm:p-6" style={cardStyle}>
        <SectionTitle zh="版权声明" en="Copyright" />
        <pre className="m-0 whitespace-pre-wrap break-words text-sm leading-6" style={bodyStyle}>
          {COPYRIGHT_NOTICE}
        </pre>
        <p className="mt-3 text-xs leading-5" style={mutedStyle}>
          上游原始项目：
          <a
            className="underline decoration-dotted hover:text-[var(--primary)]"
            href={UPSTREAM_SOURCE}
            target="_blank"
            rel="noopener noreferrer"
          >
            {UPSTREAM_SOURCE}
          </a>
          （仅版权与来源说明，不作为本部署的源码入口）。项目内的署名与 Git 历史中的贡献者署名一并保留。历史以 MIT 发布的代码继续适用原授权，见{' '}
          <a
            className="underline decoration-dotted hover:text-[var(--primary)]"
            href={`${SOURCE_URL}/blob/HEAD/LICENSES/MIT-legacy.txt`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LICENSES/MIT-legacy.txt
          </a>
          。
        </p>
      </section>

      {/* 无担保 */}
      <section className="mt-5 rounded-2xl p-5 sm:p-6" style={cardStyle}>
        <SectionTitle zh="无担保声明" en="No warranty" />
        <p className="text-sm leading-6" style={bodyStyle}>
          本程序分发时希望它有用，但<strong>不提供任何担保</strong>，甚至不提供可销售性或适用于特定用途的默示担保。详见许可证第 15、16 条。
        </p>
        <p className="mt-2 text-sm leading-6" style={bodyStyle}>
          This program is distributed in the hope that it will be useful, but{' '}
          <strong>WITHOUT ANY WARRANTY</strong>, without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See sections 15 and 16 of the license.
        </p>
      </section>

      {/* 第三方 */}
      <section className="mt-5 rounded-2xl p-5 sm:p-6" style={cardStyle}>
        <SectionTitle zh="第三方组件与字体" en="Third-party components and fonts" />
        <p className="text-sm leading-6" style={bodyStyle}>
          本项目依赖的第三方组件、字体与数据保留各自的许可证与声明，项目整体许可不替代这些条款。完整清单位于源码仓库的{' '}
          <a
            className="underline decoration-dotted hover:text-[var(--primary)]"
            href={`${SOURCE_URL}/blob/HEAD/THIRD-PARTY-NOTICES.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            THIRD-PARTY-NOTICES.md
          </a>
          ，Docker 镜像内也包含同名文件。
        </p>
        <p className="mt-2 text-xs leading-5" style={mutedStyle}>
          其中 Noto Sans JP 与 JetBrains Mono 以 SIL Open Font License 1.1 分发，界面会把这些字体的字库文件直接提供给浏览器，因此其许可证正文与版权声明随本项目一并提供。
        </p>

        <details className="mt-3 rounded-xl" style={{ border: '1px solid var(--line)' }}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium" style={headingStyle}>
            第三方声明全文（含字体 OFL-1.1 正文）
          </summary>
          <pre
            className="m-0 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-xs leading-5"
            style={{ ...bodyStyle, borderTop: '1px solid var(--line)' }}
          >
            {thirdPartyText}
          </pre>
        </details>
      </section>

      {/* 全文 */}
      <section className="mt-5 rounded-2xl p-5 sm:p-6" style={cardStyle}>
        <SectionTitle zh="完整条款" en="Full texts" />

        <details className="mt-3 rounded-xl" style={{ border: '1px solid var(--line)' }}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium" style={headingStyle}>
            许可证正文：{LICENSE_NAME}
          </summary>
          <pre
            className="m-0 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-xs leading-5"
            style={{ ...bodyStyle, borderTop: '1px solid var(--line)' }}
          >
            {licenseText}
          </pre>
        </details>

        <details className="mt-3 rounded-xl" style={{ border: '1px solid var(--line)' }}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium" style={headingStyle}>
            版权与来源声明（NOTICE）
          </summary>
          <pre
            className="m-0 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-xs leading-5"
            style={{ ...bodyStyle, borderTop: '1px solid var(--line)' }}
          >
            {noticeText}
          </pre>
        </details>

        <p className="mt-4 text-xs leading-5" style={mutedStyle}>
          另有许可范围说明{' '}
          <a
            className="underline decoration-dotted hover:text-[var(--primary)]"
            href={`${SOURCE_URL}/blob/HEAD/LICENSING.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LICENSING.md
          </a>
          （MIT 历史版本边界、分发与部署要求）与{' '}
          <a
            className="underline decoration-dotted hover:text-[var(--primary)]"
            href={`${SOURCE_URL}/blob/HEAD/SOURCE`}
            target="_blank"
            rel="noopener noreferrer"
          >
            SOURCE
          </a>
          （第 6 条书面要约）。
        </p>
      </section>

      <p className="mt-6 text-center text-xs" style={mutedStyle}>
        {PROJECT_NAME} · {LICENSE_ID} · 本页内容不替代许可证正文
      </p>
    </div>
  );
}
