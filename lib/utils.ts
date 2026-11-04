// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
