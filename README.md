# Sine Cloud Skills

Official Agent Skills for [Sine Cloud](https://sinecloud.dev): Agents, Box, Powers and Gateway.

Each Skill teaches an agent one capability a user actually wants — run an agent session, use a cloud box, call a tool, or reach a model — instead of one connection method. MCP, the SDK, the CLI, raw HTTP and the Console are five ways to reach the same published API; they are described once in `references/access.md` inside each Skill, never as separate Skills.

## Install

```bash
npx skills add fei-bai-inc/sinecloud-skills
```

Install one Skill, or read the instructions without installing:

```bash
npx skills add fei-bai-inc/sinecloud-skills --skill sinecloud-agents   # one Skill (any name in the table)
npx skills add fei-bai-inc/sinecloud-skills --list
```

Claude Code plugin marketplace:

```text
/plugin marketplace add fei-bai-inc/sinecloud-skills
/plugin install sinecloud@sinecloud
```

Any Agent with standard Skill support can also copy `skills/<name>/` into its own Skill directory.

## Skills

| Skill | Use it for | Requires |
| --- | --- | --- |
| [`sinecloud`](./skills/sinecloud/SKILL.md) | First contact: pick the product for the task, prepare least-privilege access, check balance, then hand off | Organization; owner or admin for key creation |
| [`sinecloud-agents`](./skills/sinecloud-agents/SKILL.md) | Configure an Agent, run a session, stream a turn, read items and per-session usage | `agentRun`; available model route; credits |
| [`sinecloud-box`](./skills/sinecloud-box/SKILL.md) | Operate an existing Box: workspace files, commands, Sandbox windows, backups | `fileRead`, plus `fileWrite` / `boxRun`; credits |
| [`sinecloud-powers`](./skills/sinecloud-powers/SKILL.md) | Discover tool endpoints, quote, run with a schema-based input, read results and usage | `catalogRead`, `toolRun`, `runRead`; credits |
| [`sinecloud-gateway`](./skills/sinecloud-gateway/SKILL.md) | Call models and media endpoints, inspect tasks, respect budgets and settlement | `modelInvoke`, `modelRead`; credits or BYOK connection |

Requirements: Node.js 24.19+ for `@sinecloud/cli`, an organization API key with the scopes above, and organization credits for paid work. Free access, request rates and concurrency limits are separate from calling balance.

## How these Skills are built

- **Capability, not transport.** `sinecloud-mcp`, `sinecloud-sdk`, `sinecloud-cli` and `sinecloud-api` are deliberately absent; their content lives in every Skill's `references/access.md`.
- **Contract first.** An Agent discovers real operations with `sinecloud api list`, reads the published OpenAPI in `references/operations.md`, and never invents an ID, field, scope or status.
- **Costs stated up front.** Every Skill says what is reserved, what is settled, and which action needs a quote or a budget.
- **Recovery before retry.** Unknown outcomes keep their request identity; the Skills say which record to re-read instead of submitting new work.
- **Bounded depth.** `SKILL.md` stays a decision tree; operational tables are generated into `references/`.

## Repository layout

```text
skills/<name>/SKILL.md        Skill instructions and triggers
skills/<name>/references/     access.md, costs.md, feedback.md (shared) + operations.md (generated)
shared/                       single source copied into every Skill by scripts/sync-shared.mjs
scripts/                      sync, generate and validate
examples/                     evaluation prompts and dated evidence
```

## Maintenance

```bash
npm install
npm run sync        # copy shared/*.md into every Skill
npm run generate    # regenerate references/operations.md from the CLI manifest + live OpenAPI
npm run validate    # frontmatter, shared copies, generated tables, commands, paths, links, secrets
```

`npm run validate` runs in CI on every pull request. Product changes that add, remove or re-scope an operation must regenerate `operations.md` in the same pull request.

Found wrong or outdated guidance? Open an issue with the template in any Skill's `references/feedback.md`. Product support and account questions belong to support@sinecloud.dev, not to this repository.

## License

MIT. See [LICENSE](./LICENSE).
