'use client';

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Icon } from './Icons';
import {
  CHANGELOG_ENTRIES,
  formatChangelogDate,
  pickChangelogText,
  type ChangelogKind,
} from '../lib/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 这次打开时要标「新」的条目 id */
  unseenIds: Set<string>;
}

const KIND_LABEL: Record<ChangelogKind, string> = {
  new: '新功能',
  improved: '改进',
  fixed: '修复',
};

export default function ChangelogModal({ isOpen, onClose, unseenIds }: ChangelogModalProps) {
  const { t, locale } = useLanguage();

  // Esc 关闭；关闭时才算「看过」，所以这里也走 onClose。
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleOutsideClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      id="changelogModal"
      className="settings-modal"
      style={{ display: isOpen ? 'flex' : 'none' }}
      onClick={handleOutsideClick}
    >
      <div
        className="settings-modal-content changelog-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={t("更新日志")}
      >
        <div className="changelog-header">
          <div className="min-w-0">
            <h2 className="changelog-title">{t("更新日志")}</h2>
            <p className="changelog-subtitle">{t("新功能与改进都记在这里")}</p>
          </div>
          <button
            type="button"
            className="settings-modal-close-button"
            title={t("关闭更新日志")}
            aria-label={t("关闭更新日志")}
            onClick={onClose}
          >
            {Icon.xSm}
          </button>
        </div>

        {CHANGELOG_ENTRIES.length === 0 ? (
          <p className="changelog-empty">{t("暂无更新内容")}</p>
        ) : (
          <ol className="changelog-list">
            {CHANGELOG_ENTRIES.map((entry) => {
              const isNew = unseenIds.has(entry.id);
              return (
                <li key={entry.id} className="changelog-entry" data-fresh={isNew ? 'true' : undefined}>
                  <div className="changelog-entry-head">
                    <span className="changelog-badge" data-kind={entry.kind}>
                      {t(KIND_LABEL[entry.kind])}
                    </span>
                    <h3 className="changelog-entry-title">{pickChangelogText(entry.title, locale)}</h3>
                    {isNew && <span className="changelog-new-dot" title={t("新")} aria-label={t("新")} />}
                    <time className="changelog-date" dateTime={entry.date}>
                      {formatChangelogDate(entry.date, locale)}
                    </time>
                  </div>
                  <ul className="changelog-items">
                    {pickChangelogText(entry.items, locale).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
