'use client';

import { useCallback, useEffect, useState } from 'react';
import { browserStorage } from '../utils/storage';
import {
  CHANGELOG_SEEN_STORAGE_KEY,
  getLatestChangelogId,
  getUnseenChangelogIds,
  hasUnseenChangelog,
} from '../lib/changelog';

/**
 * 更新日志的开关与「有没有新版」。
 * 已读位置在关闭弹窗时才写入：打开期间要保留每条的新标记，关掉才算看过。
 */
export function useChangelog() {
  const [isOpen, setIsOpen] = useState(false);
  const [seenId, setSeenId] = useState<string | null>(null);
  // 打开那一刻的已读位置，用来算出这次要标「新」的是哪几条。
  const [openedAt, setOpenedAt] = useState<string | null>(null);

  useEffect(() => {
    setSeenId(browserStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY));
  }, []);

  const open = useCallback(() => {
    setOpenedAt(seenId);
    setIsOpen(true);
  }, [seenId]);

  const close = useCallback(() => {
    const latest = getLatestChangelogId();
    if (latest && latest !== seenId) {
      browserStorage.setItem(CHANGELOG_SEEN_STORAGE_KEY, latest);
      setSeenId(latest);
    }
    setIsOpen(false);
  }, [seenId]);

  return {
    isOpen,
    open,
    close,
    hasUnread: hasUnseenChangelog(seenId),
    unseenIds: getUnseenChangelogIds(openedAt),
  };
}
