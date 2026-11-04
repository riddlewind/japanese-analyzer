# 许可证范围与版本边界 / Licensing and version boundary

## 当前许可 / Current license

本项目从 `agpl-3.0-start` 标记的许可证切换提交起，整体按照 **GNU Affero General Public License, version 3 only（AGPL-3.0-only）** 分发。完整正文见 [LICENSE](./LICENSE)，版权与来源说明见 [NOTICE](./NOTICE)。没有附加禁止商用、强制购买商业授权或其他额外限制。

Starting with the license-transition commit tagged `agpl-3.0-start`, the project as a whole is distributed under **GNU AGPL version 3 only (AGPL-3.0-only)**. See [LICENSE](./LICENSE) for the complete terms and [NOTICE](./NOTICE) for attribution. No noncommercial restriction, mandatory commercial-license purchase, or other additional restriction is imposed.

## 历史 MIT 版本 / Historical MIT versions

| 标签 / Tag | 含义 / Meaning |
| --- | --- |
| `mit-final` | 切换前最后一个项目整体采用 MIT 的快照 / Final project-wide MIT snapshot before the transition |
| `agpl-3.0-start` | 首次整体采用 AGPL-3.0-only 的提交 / First commit distributing the project as a whole under AGPL-3.0-only |

`mit-final` 固定指向 `fb57ddca483f3bfe816a3ca8e59d6d5208ef7c64`。该提交中的许可证及此前已经按 MIT 发布的代码继续保留原有授权。原版权与许可正文逐字保存在 [LICENSES/MIT-legacy.txt](./LICENSES/MIT-legacy.txt)。

`mit-final` points to `fb57ddca483f3bfe816a3ca8e59d6d5208ef7c64`. Code already released under MIT remains available under its original grant. The original copyright and permission notice is preserved verbatim in [LICENSES/MIT-legacy.txt](./LICENSES/MIT-legacy.txt).

新许可不追溯撤销旧 MIT 授权，也不把未改变的历史 MIT 代码变成只能按 AGPL 使用的代码。AGPL 是此后项目整体及按 AGPL 发布的新贡献、修改的许可；应同时保留其中历史 MIT 材料及第三方组件的原有声明。仓库中存在其他贡献者的作品，Git 历史中的署名和现有源文件声明应予保留。

The new license does not retroactively revoke MIT permissions or make unchanged historical MIT material exclusively AGPL-licensed. AGPL governs the project as a whole after the transition and new contributions and modifications released under AGPL. Preserve the original notices for historical MIT material and third-party components. Other contributors' authorship recorded in Git history and source-file notices remains intact.

## 使用与分发 / Use and distribution

- AGPL 允许个人使用和商业使用，不要求向本项目购买商业授权。
- 分发适用作品的可执行版本（例如 APK、Docker 镜像）时，按 AGPL 第 6 条提供对应源码，并保留相应许可及版权声明。
- 修改本程序后通过网络提供交互服务时，按第 13 条向交互用户显著提供免费获取该修改版本对应源码的方式。
- 对应源码应匹配实际分发或运行的版本，包括适用的修改及构建、安装和运行脚本。仅链接到不包含自己修改的上游仓库，不能替代提供这些修改的对应源码。
- 不要将 API Key、密码或其他部署凭据混入源码包；提供配置模板和必要说明即可。

Commercial and personal use are permitted. When distributing covered executable works, including APKs or Docker images, provide Corresponding Source under section 6 and preserve applicable notices. When offering a modified version for remote network interaction, prominently offer its users free access to that version's Corresponding Source under section 13. Source must match the actual version, including covered modifications and relevant build, installation, and execution scripts; an upstream link omitting your changes is insufficient. Use configuration templates rather than including deployment secrets.

## 本仓库的修改 / Modifications in this repository

本仓库是上游项目的修改版（fork），源码地址见 [NOTICE](./NOTICE)。按 AGPL 第 5 条(a) 要求，2026-11-04 的修改内容在此声明：新增 `/legal` 页面（公布对应源码、构建版本、修改说明、版权与许可证及第三方声明全文，顶栏与页脚均有入口）；新增 `SOURCE`（第 6 条书面要约）与 `THIRD-PARTY-NOTICES.md`；为源文件补充 SPDX 标识与版权行；调整打包（Dockerfile 携带声明文件与 OCI 许可元数据、透传 `SOURCE_URL`/`SOURCE_VERSION`，CI 构建前执行合规自检）。分析功能本身未作改动，后续修改以本仓库 Git 历史为准。

This repository is a modified version (fork) of the upstream project; the source URL is recorded in [NOTICE](./NOTICE). As required by section 5(a) of the license, the modifications made on 2026-11-04 are: a `/legal` page publishing the Corresponding Source, build identifier, modification statement, copyright notice and the full license and third-party notice texts (linked from header and footer); the addition of `SOURCE` (the section 6 written offer) and `THIRD-PARTY-NOTICES.md`; SPDX identifiers and copyright lines in source files; and packaging changes (the Dockerfile ships the notice files and OCI license metadata and carries `SOURCE_URL` / `SOURCE_VERSION`, and CI runs the compliance check before building). The analysis features are unchanged; later modifications are recorded in this repository's Git history.

## 部署与贡献 / Deployment and contributions

项目界面已有源码入口：顶栏图标与页脚链接指向 `/legal`，该页给出对应源码地址、构建版本、修改说明、版权、完整许可证正文，并内联第三方声明全文（含两个自托管字体的 OFL-1.1 正文，因为字库文件会直接发给浏览器，属于随分发必须提供的声明）。部署自己的修改版时，应通过环境变量把源码入口指向实际部署版本的对应源码，而不是保留无法反映修改的上游链接（这些变量在请求时读取，改完重启即可，无需重新构建）：

```sh
SOURCE_URL=https://github.com/<you>/<your-fork>
SOURCE_VERSION=<部署的提交或标签>
MODIFICATION_NOTICE=<可选：修改说明>
```

GitHub Actions 构建的镜像会自动带入 `github.repository` 与 `github.sha`，Vercel 部署会从平台注入的仓库信息推导，这两种情况都无需手工配置。只有在本地或自定义环境构建、且上述变量为空时，`/legal` 才会显示“取自内置默认值”的提示。

Images built by the GitHub Actions workflow carry `github.repository` and `github.sha` automatically, and Vercel deployments derive both from the platform's environment. Neither needs manual configuration; only local or custom builds with these variables unset fall back to the built-in default and show the notice on `/legal`.

Docker 运行镜像会包含 `LICENSE`、`NOTICE`、`LICENSING.md`、`LICENSES/`、`THIRD-PARTY-NOTICES.md` 和 `SOURCE`；这些声明文件本身不替代对应源码的提供义务。

The UI already offers a source entry point: the header icon and the footer link lead to `/legal`, which lists the source repository, build identifier, modification statement, copyright and the full license text, and embeds the full third-party notices — including the OFL-1.1 text for both self-hosted fonts, whose files are served directly to browsers and therefore must ship with their notices. Deployments of a modified version must point that entry at the source of the version actually served, using the environment variables above rather than an upstream link that cannot reflect their changes.

The Docker runtime image includes `LICENSE`, `NOTICE`, `LICENSING.md`, `LICENSES/`, `THIRD-PARTY-NOTICES.md` and `SOURCE`; including these notices does not replace source-provision obligations.

新增贡献请使用与当前项目兼容的许可，并保留引入的第三方代码声明。当前没有要求贡献者转让版权，也没有通过本说明取得替他人作品授予不同商业许可的权利。

Use a license compatible with the current project for new contributions and preserve notices for any third-party code you introduce. Contributors are not required by this notice to assign copyright, and this notice does not grant authority to offer others' work under a separate commercial license.

## 合规落点 / Where each obligation is met

| 义务 / Obligation | 落点 / Implemented by |
| --- | --- |
| §4–§5 随分发保留许可与版权声明 / keep license and copyright notices with distribution | [`LICENSE`](./LICENSE)、[`NOTICE`](./NOTICE)、[`LICENSES/MIT-legacy.txt`](./LICENSES/MIT-legacy.txt)；Docker 运行镜像复制这些文件 |
| §5 源文件标明许可 / license identifier in sources | 所有源文件带 `SPDX-License-Identifier: AGPL-3.0-only` 与版权行，`scripts/add-spdx-headers.mjs --check` 在 CI 校验 |
| §13 网络交互提供对应源码 / Corresponding Source over a network | 应用内 `/legal` 页面（顶栏与页脚均有入口），给出源码仓库、构建版本、修改说明与许可证正文 |
| §6 目标代码分发的源码要约 / source offer for object code | [`SOURCE`](./SOURCE) 书面要约；镜像内含同名文件 |
| 第三方声明 / third-party notices | [`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md)，由 `npm run notices` 从 `package-lock.json` 生成，含字体 OFL 正文 |
| 新增贡献的许可一致性 / inbound = outbound | [`CONTRIBUTING.md`](./CONTRIBUTING.md)，无 CLA、无版权转让 |

`npm run check:license` 会校验上述落点是否仍然成立（声明文件齐全、`/legal` 入口可达、
Dockerfile 复制声明、第三方清单与 SPDX 头未漂移），CI 在构建前执行。

`npm run check:license` verifies these placements still hold — notice files present, the `/legal`
entry reachable, the Dockerfile copying the notices, and the third-party list and SPDX headers not
drifting. CI runs it before building.

以上是项目的许可范围及操作说明，不替代 [AGPL 正文](./LICENSE)和适用材料的原有许可。

These notes explain project scope and practices; the [AGPL text](./LICENSE) and the original licenses of applicable materials govern.
