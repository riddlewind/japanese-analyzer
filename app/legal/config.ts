// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

/**
 * AGPL-3.0 §13 披露信息。
 *
 * 默认值指向本仓库（部署版本的来源）。部署**修改版**时必须用 SOURCE_URL 指向
 * 实际部署的那份源码，否则无法满足第 13 条的源码提供义务。
 */

/** 上游原始项目，仅用于版权与来源说明，不作为本部署的源码入口。 */
export const UPSTREAM_SOURCE = 'https://github.com/cokice/japanese-analyzer';

/** 本仓库：默认的对应源码位置。 */
export const DEFAULT_SOURCE = 'https://github.com/riddlewind/japanese-analyzer';

function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export const PROJECT_NAME = 'japanese-analyzer';

export const LICENSE_ID = 'AGPL-3.0-only';

export const LICENSE_NAME = 'GNU Affero General Public License, version 3 only';

export const COPYRIGHT_NOTICE = 'Copyright (C) 2025 Howen\nCopyright (C) 2026 Howen and contributors';

/**
 * 运行时变量优先，构建期 NEXT_PUBLIC_* 作为回退，再回退到平台注入的仓库信息。
 * 这样用预构建镜像或 Vercel 部署时，源码入口会自动指向部署者自己的仓库，不必手工配置。
 */
function platformSource(): string {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  return owner && slug ? `https://github.com/${owner}/${slug}` : '';
}

const configuredSource = firstNonEmpty(
  process.env.SOURCE_URL,
  process.env.NEXT_PUBLIC_SOURCE_URL,
  platformSource(),
);

export const SOURCE_URL = configuredSource || DEFAULT_SOURCE;

/** 源码地址是否来自内置默认值（即部署方与环境都没有给出仓库信息）。 */
export const SOURCE_IS_DEFAULT = !configuredSource;

/** 该构建对应的提交或标签，用于让用户定位到完全一致的源码。 */
export const SOURCE_VERSION = firstNonEmpty(
  process.env.SOURCE_VERSION,
  process.env.NEXT_PUBLIC_SOURCE_VERSION,
  process.env.VERCEL_GIT_COMMIT_SHA,
);

/** 部署运营者声明的修改说明（可选）。空字符串表示未声明。 */
export const MODIFICATION_NOTICE = firstNonEmpty(
  process.env.MODIFICATION_NOTICE,
  process.env.NEXT_PUBLIC_MODIFICATION_NOTICE,
);
