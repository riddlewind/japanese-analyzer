// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025-2026 Howen and contributors

/** Own a single asynchronous result, even when the underlying work ignores abort. */
export class LatestRequest {
  private controller: AbortController | null = null;

  cancel() {
    this.controller?.abort();
    this.controller = null;
  }

  start() {
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    return {
      signal: controller.signal,
      isCurrent: () => this.controller === controller && !controller.signal.aborted,
    };
  }
}
