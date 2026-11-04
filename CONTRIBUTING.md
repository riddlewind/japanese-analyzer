# 贡献指南 / Contributing

本项目以 **AGPL-3.0-only** 分发。提交贡献即表示你同意自己的贡献按同一许可证（AGPL-3.0-only）授权，
并同意在 `NOTICE` 与源文件中以 `Howen and contributors` 的形式署名。

By submitting a contribution you agree that it is licensed under AGPL-3.0-only, the same license
as the project, and that it may be attributed as `Howen and contributors` in `NOTICE` and source
headers.

## 提交前请确认 / Before you open a pull request

1. **许可兼容**：新增依赖须与 AGPL-3.0-only 兼容。引入新依赖后运行 `npm run notices` 并提交
   更新后的 `THIRD-PARTY-NOTICES.md`。
   New dependencies must be AGPL-3.0 compatible. Run `npm run notices` and commit the updated
   `THIRD-PARTY-NOTICES.md`.
2. **保留声明**：不要删除或改写 `LICENSE`、`NOTICE`、`LICENSING.md`、`LICENSES/`、`SOURCE`、
   `THIRD-PARTY-NOTICES.md`，也不要移除其他贡献者的版权行。
   Do not remove or rewrite the notice files or other contributors' copyright lines.
3. **新增文件带 SPDX 标识**：新建源码文件请运行 `npm run check:license` 前先执行
   `node scripts/add-spdx-headers.mjs`，它会补上缺失的头部。
   New source files need the SPDX header; run `node scripts/add-spdx-headers.mjs`.
4. **改动可追溯**：本项目的改动记录以 Git 历史为准，提交信息请说明改了什么、为什么改。
   Change history lives in Git; describe what and why in your commit message.

## 本地检查 / Local checks

```sh
npm ci
npm test
npm run lint
npm run check:license   # 声明文件、/legal 入口、镜像声明、第三方清单、SPDX 头
npm run build
```

CI 会执行同样的检查；`npm run check:license` 未通过时不应合并。

CI runs the same checks. A failing `npm run check:license` blocks merging.

## 版权 / Copyright

项目不要求贡献者转让版权，也没有 CLA。你保留自己贡献的版权，同时按 AGPL-3.0-only 授权本项目
分发它。历史以 MIT 发布的代码继续适用原 MIT 授权，见 `LICENSES/MIT-legacy.txt`。

No copyright assignment and no CLA. You keep the copyright to your contribution and license the
project to distribute it under AGPL-3.0-only. Code previously released under MIT keeps that grant;
see `LICENSES/MIT-legacy.txt`.
