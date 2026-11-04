// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

import { NextResponse } from 'next/server';
import { buildUmamiLoaderScript, resolveUmamiConfig } from '../../_utils/umami';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const javascriptHeaders = {
  'Content-Type': 'application/javascript; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
};

export function GET() {
  return new NextResponse(
    buildUmamiLoaderScript(resolveUmamiConfig()),
    { headers: javascriptHeaders }
  );
}
