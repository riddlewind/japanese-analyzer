定时检查发现上游 `{{UPSTREAM}}` 的许可声明发生变化。

## 检出内容

{{NOTES}}
## 处理步骤

1. 打开上游 `LICENSE` / `NOTICE`，确认新条款是否仍允许本项目当前的 AGPL-3.0 使用与分发。
2. **在合并任何上游新提交之前**先做决定：
   - 不兼容 → 钉住最后一次兼容的 commit，打 tag，之后只 cherry-pick 需要的修复，不要整体合并。
   - 兼容且要合并 → 更新 `LICENSE`、`NOTICE`、`LICENSING.md`、各语言 README 的许可段、`package.json` 的 `license` 字段、`app/legal/config.ts` 里的 `LICENSE_ID`，以及新增文件的 SPDX 头。
3. 重新生成 `THIRD-PARTY-NOTICES.md`（`npm run notices`），跑 `npm run check:license`。
4. 确认无误后，把 `.github/upstream-license-baseline.json` 更新为新的 `licenseField` 与 `licenseSha256`，再关闭本 issue。

> 提醒：上游改协议不会让你已 fork 的版本失效——许可不可撤销。风险只出现在合并新代码、或声明与实际代码不一致时。
