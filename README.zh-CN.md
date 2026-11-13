# Sine Cloud Skills

面向 [Sine Cloud](https://sinecloud.dev) 的官方 Agent Skills：Agents、Box、Powers、Gateway。

每个 Skill 教 agent 完成一件用户真正要做的事：跑一次 agent 会话、用云端 Box、调一个工具、调用模型。

## 安装

```bash
npx skills add fei-bai-inc/sinecloud-skills
```

只装一个，或先看清单：

```bash
npx skills add fei-bai-inc/sinecloud-skills --skill sinecloud-agents
npx skills add fei-bai-inc/sinecloud-skills --list
```

Claude Code 插件市场：

```text
/plugin marketplace add fei-bai-inc/sinecloud-skills
/plugin install sinecloud@sinecloud
```

任何支持标准 Skill 的 agent 也可以直接把 `skills/<name>/` 复制到自己的 Skill 目录。

## 技能清单

| Skill | 用来做什么 | 前置条件 |
| --- | --- | --- |
| `sinecloud` | 首次接入：选对产品、准备最小权限、检查余额，然后交给对应产品 Skill | 组织；建 key 需要 owner 或 admin |
| `sinecloud-agents` | 配置 Agent、开启会话、流式读取一轮回答、查看 items 与会话用量 | `agentRun`；可用的模型路由；余额 |
| `sinecloud-box` | 操作已有 Box：工作区文件、命令执行、Sandbox 窗口、备份 | `fileRead`，另需 `fileWrite` / `boxRun`；余额 |
| `sinecloud-powers` | 发现工具 endpoint、报价、按 schema 传参执行、读取结果与用量 | `catalogRead`、`toolRun`、`runRead`；余额 |
| `sinecloud-gateway` | 调用模型与多模态接口、查看异步任务、遵守预算与结算规则 | `modelInvoke`、`modelRead`；余额或 BYOK 连接 |

依赖：`@sinecloud/cli` 需要 Node.js 24.19+；需要带上述 scope 的组织 API Key；付费操作需要组织积分。免费额度、请求速率与并发限制和可调用余额是三件事。

## 设计原则

- **契约优先。** 用 `sinecloud api list` 发现真实操作，从生成的 `references/operations.md` 读 operationId、路径与 scope；不猜 ID、字段、错误码。
- **先讲成本。** 每个 Skill 说明什么被预留、什么已结算、哪一步需要报价或预算。
- **先恢复再重试。** 结果未知时保留原请求身份，按 Skill 指定的记录回查，而不是重新提交。
- **分层。** `SKILL.md` 只做决策树，操作表格生成进 `references/`。

## 仓库结构

```text
skills/<name>/SKILL.md        触发条件与执行步骤
skills/<name>/references/     access.md、costs.md、feedback.md（共享）+ operations.md（生成）
shared/                       单一源，由 scripts/sync-shared.mjs 同步进每个 Skill
scripts/                      同步、生成、校验
examples/                     评测提示词与带日期的证据
```

## 维护

```bash
npm install
npm run sync        # 把 shared/*.md 同步进每个 Skill
npm run generate    # 由 CLI manifest + 线上 OpenAPI 生成 references/operations.md
npm run validate    # frontmatter、同步副本、生成表格、命令、路径、链接、敏感信息
```

`npm run validate` 在每次 PR 的 CI 中运行。产品新增、删除或改 scope 的操作，必须在同一个 PR 里重新生成 `operations.md`。

发现描述错误或过期：按 Skill 内 `references/feedback.md` 的模板提 issue。产品支持与账号问题请发 support@sinecloud.dev，不要开在本仓库。

## 许可

MIT，见 [LICENSE](./LICENSE)。
