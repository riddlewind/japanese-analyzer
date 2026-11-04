'use client';

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors


import { useLanguage } from '../contexts/LanguageContext';
import Image from 'next/image';
import type { AIProvider } from '../services/api';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { Icon } from './Icons';
import { ProviderLogo, PROVIDER_LABELS } from './ProviderLogo';

interface HeaderProps {
  thinking: boolean;
  aiProvider: AIProvider;
  onSettingsClick?: () => void;
  /** 打开更新日志 */
  onChangelogClick?: () => void;
  /** 有没看过的新功能时在图标上点一个小圆点 */
  hasUnreadChangelog?: boolean;
}

export default function Header({ aiProvider, onSettingsClick, onChangelogClick, hasUnreadChangelog = false }: HeaderProps) {
  const { t } = useLanguage();
  const providerLabel = PROVIDER_LABELS[aiProvider];

  return (
    <header className="app-header mx-auto flex w-full max-w-[1240px] items-center px-4 py-4 sm:px-9 sm:py-5">
      {/* 整页导航以重置当前输入、解析和聊天状态。 */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="brand-home flex min-w-0 items-center" aria-label={t("返回首页")} title={t("返回首页")}>
        <Image
          src="/logo/logo-text.png"
          alt={t("日本語文章解析")}
          width={1323}
          height={330}
          priority
          sizes="(min-width: 640px) 290px, 210px"
          className="brand-logo brand-logo-light h-9 w-auto max-w-[210px] object-contain sm:h-11 sm:max-w-[290px]"
        />
        <Image
          src="/logo/logo-text-dark.png"
          alt={t("日本語文章解析")}
          width={1323}
          height={330}
          priority
          sizes="(min-width: 640px) 290px, 210px"
          className="brand-logo brand-logo-dark h-9 w-auto max-w-[210px] object-contain sm:h-11 sm:max-w-[290px]"
        />
      </a>
      <div className="flex-1" />
      <div className="glass-toolbar flex items-center gap-1 sm:gap-2">
        <span
          className="provider-indicator"
          title={t("当前模型服务商：{0}", providerLabel)}
          aria-label={t("当前模型服务商：{0}", providerLabel)}
        >
          <ProviderLogo provider={aiProvider} className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>{providerLabel}</span>
        </span>
        {/* AGPL-3.0 第 13 条要求的源码入口：指向 /legal，由该页给出对应源码地址与许可证正文。 */}
        <a
          href="/legal"
          title={t("源代码与许可证 (AGPL-3.0)")}
          aria-label={t("源代码与许可证 (AGPL-3.0)")}
          className="grid h-10 w-10 place-items-center rounded-[10px] transition-colors hover:text-[var(--primary)]"
          style={{ color: 'var(--ink-2)' }}
        >
          {Icon.github}
        </a>
        <ThemeToggle />
        {onChangelogClick && (
          <button
            onClick={onChangelogClick}
            title={hasUnreadChangelog ? `${t("更新日志")} · ${t("有新功能")}` : t("更新日志")}
            aria-label={hasUnreadChangelog ? `${t("更新日志")} · ${t("有新功能")}` : t("更新日志")}
            className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-[10px] border-none bg-transparent transition-colors hover:text-[var(--primary)]"
            style={{ color: 'var(--ink-2)' }}
          >
            {Icon.megaphone}
            {hasUnreadChangelog && <span className="header-notice-dot" aria-hidden="true" />}
          </button>
        )}
        <LanguageToggle />
        <button
          onClick={onSettingsClick}
          title={t("设置")}
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-[10px] border-none bg-transparent transition-colors hover:text-[var(--primary)]"
          style={{ color: 'var(--ink-2)' }}
        >
          {Icon.gear}
        </button>
      </div>
    </header>
  );
}
