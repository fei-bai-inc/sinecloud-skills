---
name: sinecloud
description: |-
  First contact with Sine Cloud: choose the right product for the task, prepare least-privilege access, confirm balance and entitlement, then hand off to the product Skill.
  TRIGGER when the user mentions Sine Cloud / sinecloud / `sinecloud.dev`, or asks to connect an agent to it, create an API key for it, or find out which of Agents, Box, Powers or Gateway does what — without already naming a product task.
  SKIP when the task already belongs to one product (load that Skill) or is about self-hosting a Sine Cloud fork; this Skill never operates product resources.
---

# Sine Cloud: choose the capability, then gain access

Sine Cloud is one organization workspace over four products. The Console is for humans; every product also publishes an HTTP API that the `sinecloud` CLI, `@sinecloud/sdk`, the remote MCP server and raw HTTP call.

This Skill answers three questions and stops: **which product**, **which access path**, **does this organization have what it takes**. Product work belongs to the product Skill.

## Ask only what the result depends on

Infer from the project and the request; ask only when the choice changes the paid action:

- What is the user trying to produce — an agent conversation, a command execution, a tool call, or model output?
- Where does it run — a human in Console, an agent in a terminal, an MCP-capable host, or shipped application code?
- Which organization, and does the user have a key already?

## Step 1 — pick the product

| The user wants | Product | Load |
| --- | --- | --- |
| An agent that answers, calls tools and keeps a session | Agents | `sinecloud-agents` |
| A file space where code runs, with an optional VM window | Box | `sinecloud-box` |
| One external tool call with a published input contract | Powers | `sinecloud-powers` |
| Model output: text, embeddings, images, audio, video, 3D, documents | Gateway | `sinecloud-gateway` |

Products do not imply each other: Agents access does not grant Box access, and either can exist without the other. Read [`references/products.md`](references/products.md) when the boundary is unclear or the user needs Console-only steps.

## Step 2 — pick one access path

Read [`references/access.md`](references/access.md) and choose exactly one, from the environment rather than from habit:

- terminal agent, no application code → CLI (`npx @sinecloud/cli@0.1.0`);
- MCP host (Claude Code, Cursor, Codex) → `https://sinecloud.dev/api/mcp` with the same key;
- shipped server or worker → `@sinecloud/sdk`;
- no Node.js, or a one-off request → raw HTTP against the published OpenAPI;
- a human action the API does not expose (buy credits, create a key, prepare a workspace, start a Sandbox window, approve BYOK) → Console.

Do not set up two paths for one task, and do not repeat the access instructions in your answer; link or summarize them.

## Step 3 — establish credentials

An **organization API key** (`sc_…`) is the only credential a product API accepts; Console sessions are rejected.

1. An owner or admin creates the key in Console → **API Keys**, with only the scopes the task needs (table in [`references/access.md`](references/access.md)) and the narrowest project scope.
2. The secret is shown once. It goes into a secret manager or environment variable, never into chat, a repository, a URL or a log.
3. Verify before doing paid work:

```bash
npx @sinecloud/cli@0.1.0 auth status --json                     # after `auth login`; saved key is owner-only
npx @sinecloud/cli@0.1.0 api list --product gateway --json      # every operation for that product
npx @sinecloud/cli@0.1.0 api call listModels --json             # one read-only call through the same key
```

The CLI stores the device-login key itself; when a key already exists, prefer `SINECLOUD_API_KEY` over pasting anything into a command history.

## Step 4 — confirm the organization can execute

Before any paid call, check all four; a pass on one does not imply the others:

1. **Scope** — the key carries the capability the operation needs.
2. **Entitlement** — the product is enabled for this organization; a visible product entry is not proof.
3. **Balance** — available credits exist after commitments. Read them in Console → Billing; see [`references/costs.md`](references/costs.md).
4. **Resource** — the target instance, Box, endpoint, connection or route exists and is addressable by this key's project scope.

Report the exact missing item. Do not "fix" a 403 by retrying, widening the key yourself, or switching organization.

## Step 5 — hand off

Load the product Skill by name from Step 1, and pass along: organization, project scope, chosen access path, verified key, known resource IDs, and the cost ceiling the user accepted. If the product Skill is not installed, discover the contract instead of guessing:

```bash
npx @sinecloud/cli@0.1.0 api list --product <agents|box|powers|gateway> --json
npx @sinecloud/cli@0.1.0 openapi get <agents|box|powers|gateway> --output <file>
```

## Stop conditions

- No organization owner or admin: key creation and purchases need one; say which action needs whom.
- No balance, or a refund freeze: stop before admitting work.
- Missing entitlement, route, connection or resource: report what the API returned and the Console location that manages it.
- A key with fewer scopes than the task: stop and ask for a new key instead of requesting broader scopes than the task needs.

## Done means

The user can name the product, the access path, the key scopes, and the remaining balance; one read-only call through the chosen path returns `200` with the expected shape; and either the product Skill is running or the user has the exact command/Console step to continue.

## References

- [`references/access.md`](references/access.md) — five paths, scopes, CLI flags, exit codes, MCP and SDK setup
- [`references/products.md`](references/products.md) — what each product does, its resource model, Console-only actions
- [`references/costs.md`](references/costs.md) — reservations vs charges, per-product measurement, guardrails
- [`references/feedback.md`](references/feedback.md) — reporting wrong guidance
