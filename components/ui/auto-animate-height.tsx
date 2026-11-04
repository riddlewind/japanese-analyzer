'use client';

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors


import { useEffect, useRef, useState, type ReactNode } from 'react';
import AnimateHeight, { type Height } from 'react-animate-height';

interface AutoAnimateHeightProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  duration?: number;
}

export function AutoAnimateHeight({
  children,
  className,
  contentClassName,
  duration = 300,
}: AutoAnimateHeightProps) {
  const [height, setHeight] = useState<Height>('auto');
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = contentRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(() => {
      setHeight(element.clientHeight);
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <AnimateHeight
      className={className}
      contentClassName={contentClassName}
      contentRef={contentRef}
      disableDisplayNone
      duration={duration}
      height={height}
    >
      {children}
    </AnimateHeight>
  );
}
