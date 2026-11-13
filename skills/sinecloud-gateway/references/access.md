# Access: five ways to reach the same API

Sine Cloud publishes one HTTP API per product. The Console, the `sinecloud` CLI, `@sinecloud/sdk`, the remote MCP server and raw HTTP are different front doors onto those same operations, scopes, prices and errors. Pick **one** path for a task and stay on it; mixing paths is how credentials leak and how the same work is submitted twice.

Base URL: `https://sinecloud.dev`

| Need | Use | Why |
| --- | --- | --- |
| A human answering a form, buying credits, creating a key, starting a Sandbox window, approving BYOK | **Console** `/en/dashboard` (or `/zh-CN/dashboard`) | Some actions are session-only and cannot be called with an API key |
| An agent working in a terminal, no application code | **CLI** `npx @sinecloud/cli` | Device login, generated commands for every operation, resumable writes, waiters |
| Code you ship (server, worker, script) | **SDK** `@sinecloud/sdk` | Generated types and product namespaces for the published contract |
| An agent host that speaks MCP (Claude Code, Cursor, Codex) | **MCP** `https://sinecloud.dev/api/mcp` | The same operations as callable tools, authorized per key |
| A language or runtime without the SDK, or a one-off request | **Raw HTTP** | Every operation is reachable with `Authorization: Bearer` |

Do not install or describe the transport that you are not using. If the user's environment has no Node.js, choose raw HTTP; if it has no terminal, choose MCP or raw HTTP; if the work must survive the session, choose application code with the SDK.

## Credentials

- One credential type authorizes API work: an **organization API key** (`sc_…`) in `Authorization: Bearer`. Console sessions and cookies are rejected by product APIs.
- Keys are created by an organization owner or admin in Console → **API Keys**. The complete secret is shown once. If it is lost, revoke and create another.
- A key fixes the organization and may restrict the project. Request parameters cannot widen either.
- Never ask a user to paste a key into chat. Read it from an environment variable or a secret manager; for the CLI, let `sinecloud auth login` store it in an owner-only file.
- Never write a key into a repository, URL, log line, exception message or generated artifact. Redact it before quoting any request or response back to the user.

## Scopes

| Product | Capabilities | Notes |
| --- | --- | --- |
| Agents | `agentRun` (optional `browserRun`, `sandboxRun`) | `agentRun` is required |
| Box | `fileRead` (optional `fileWrite`, `boxRun`) | `fileRead` is required |
| Powers | `catalogRead`, `connectionRead`, `connectionWrite`, `toolRun`, `runRead`, `usageRead` | Any nonempty set |
| Gateway | `modelRead`, `modelInvoke`, `configRead`, `configWrite`, `usageRead` | `modelInvoke` alone is enough to call models; add `modelRead` to list models |

Grants stay separate per product: a Powers `usageRead` grant does not read Gateway usage, and Agents access does not grant Box access. A key never expands organization entitlements, balance or route availability.

## CLI

```bash
npx @sinecloud/cli@0.1.0 auth login          # device approval in the browser, then a minimal-scope key
npx @sinecloud/cli@0.1.0 auth status --json
npx @sinecloud/cli@0.1.0 api list --product gateway --json
npx @sinecloud/cli@0.1.0 api call listModels --json
```

- `auth login` prints an approval URL and a short code; it saves the resulting key to `$XDG_CONFIG_HOME/sinecloud/config.json` (directory `0700`, file `0600`). Session tokens are used once and never saved.
- `api list` is the authoritative command surface: every published operation gets a generated command such as `sinecloud box backups list --box-id BOX`. Confirm a command there instead of guessing one.
- `--param name=value` fills `{placeholders}` in the path; unused names become query parameters. `--instance` and `--box` fill their path values. `--project` scopes the call where the product allows it.
- Mutating calls record their identity before dispatch. An unknown outcome keeps it; resume with `--resume <id>` and the **same** input. Conclusive answers clear it.
- `--wait` polls a submitted Box command and never resubmits it (`--wait-timeout`, default 120 seconds).
- Paid operations (Powers runs, Gateway inference and media, Box execution/runtime/backup) require `--yes` without a TTY.
- `--dry-run`, `--json`, `--json-lines`, `--timeout` are available on `api call`.
- `SINECLOUD_BASE_URL` overrides the endpoint. Exit codes: `0` ok, `2` usage, `3` auth, `4` forbidden, `5` not found, `6` conflict, `7` rate limit, `8` not admitted, `9` unknown outcome, `10` upstream/unavailable.

## SDK

```bash
npm install @sinecloud/sdk
```

```ts
import { createSineCloudClient } from '@sinecloud/sdk'

const client = createSineCloudClient({
  apiKey: process.env.SINECLOUD_API_KEY!,
  // Optional; Powers and Gateway only. Agents and Box are fixed by the key.
  projectId: 'project_…',
})
```

`@sinecloud/sdk` exports `./agents`, `./box`, `./powers`, `./gateway` and `./core`. It requires Node.js 22.12+ or a Web-standard runtime. Browser use is not supported: customer routes do not enable CORS and an organization key must never reach a browser.

## MCP

```bash
claude mcp add --transport http sinecloud https://sinecloud.dev/api/mcp \
  --header "Authorization: Bearer $SINECLOUD_API_KEY"
```

Cursor (`~/.cursor/mcp.json`) and Codex use the same URL and header. The server is stateless Streamable HTTP; tools are the published customer operations, authorized by the same key and scopes. Browser sessions are rejected. `GET /api/mcp` with a valid key lists tools.

## Raw HTTP

```bash
curl -sS https://sinecloud.dev/api/openapi/index.json | jq
curl -sS -H "Authorization: Bearer $SINECLOUD_API_KEY" \
  https://sinecloud.dev/api/gateway/v1/models | jq '.data[].id' | head
```

Published contracts: `https://sinecloud.dev/api/openapi/index.json`, then `agents.json`, `box.json`, `powers.json`, `gateway.json`. Responses are the same contract the SDK and CLI use; do not infer fields from this Skill when the OpenAPI is available.

## Console-only actions

These are deliberately not API calls: purchasing credits or changing plans, creating the first organization key, preparing a product workspace, creating a Box, approving BYOK credentials, and (for some products) lifecycle changes. Read the response for the exact next step and send the user to Console instead of fabricating an endpoint.
