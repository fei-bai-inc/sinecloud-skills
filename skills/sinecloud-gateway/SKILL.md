---
name: sinecloud-gateway
description: |-
  Call Sine Cloud Gateway: list the models and routes this key can use, send chat, responses, messages, embeddings, image, audio or media requests, and follow asynchronous tasks to a real result.
  TRIGGER when the user asks to call a model through Sine Cloud, compare or list available models, generate images/audio/video/3D/documents, use an own provider connection, or inspect a Gateway task or budget.
  SKIP when the user wants an agent session with tools (Agents), a tool call (Powers), or a shell/filespace (Box).
---

# Sine Cloud Gateway: model and media access

Gateway exposes managed model routes, BYOK provider connections and asynchronous media tasks behind one organization key. Model IDs, route availability and prices are organization configuration, not constants from this Skill.

Contract: `https://sinecloud.dev/api/openapi/gateway.json`. Generated operations and scopes: [`references/operations.md`](references/operations.md).

## Before the first call

1. **Scope** — `modelInvoke` to call models; `modelRead` to list them; `configRead`/`configWrite` only for organization configuration; `usageRead` for usage. A model call needs nothing beyond `modelInvoke`.
2. **Route** — list what the key can actually reach. An empty catalog usually means routes, connections, budget or key restrictions are missing.
3. **Budget and balance** — routes may carry an organization budget; raising a budget does not add credits. Model calls and media tasks are paid per [`references/costs.md`](references/costs.md).
4. **Managed vs BYOK** — managed routes bill the organization wallet at published prices; BYOK routes have zero Cloud invocation fee but bill the provider account.

```bash
sinecloud api list --product gateway --json
sinecloud api call listModels --json | jq '.data[] | {id, owned_by}'
```

## Call a model

```bash
cat > chat.json <<'JSON'
{ "model": "<route-or-model-id from gateway models list>",
  "messages": [ { "role": "user", "content": "Explain capture groups in one sentence." } ],
  "stream": false }
JSON

sinecloud api call createChatCompletion --body @chat.json --json
```

- Other surfaces: `gateway responses create`, `gateway messages create`, `gateway embeddings create`, `gateway audio speech|transcriptions|translations`, `gateway images generations|edits`, `gateway audio speech`.
- The request body follows the published OpenAPI for that operation; do not translate a chat body into an image or audio operation.
- Prefer streaming for long output only when the client can consume it; a dropped stream is not a completed answer — re-read the task or repeat the call only with user intent.

## Media and asynchronous tasks

Media and 3D operations accept a submission and return a task identity instead of a finished artifact.

```bash
sinecloud api call image.generate --body @image.json --json      # returns a task id
sinecloud api call tasks.get --param id="$TASK_ID" --json
```

Listing and cancelling tasks use the same shape (`tasks.list`, `tasks.cancel`); see [`references/operations.md`](references/operations.md).

- Poll the task with `tasks get`; do not resubmit the generation to check status.
- A fixed-price asynchronous task is charged when the provider accepts the submission. Later failure or cancellation does not automatically refund that fee.
- Retrieve artifacts only from the URLs or fields the task declares; do not construct storage paths.

## Organization configuration

Routes, budgets and BYOK connections are organization settings. Organizing them needs Console or an organization-scoped key with `configWrite`. Increasing a budget is not funding; a budget-limited call fails admission rather than overspending. Never create or change a budget without explicit user intent.

## Recovery

| Situation | Do |
| --- | --- |
| Stream interrupted | Check the task/response identity; a reconnected stream does not replay missed content |
| Task `UNKNOWN` or polling error | Re-read the same task ID; never submit a second generation |
| `409` route/revision mismatch | Re-read the route and price, then ask the user before retrying |
| `402` insufficient credits or budget | Stop; funding is a Console action by an owner or admin |
| `403` missing scope | Stop; `modelInvoke` or `modelRead` must be granted on a new or updated key |
| Empty model list | Report the empty catalog and the Console location; do not guess model IDs |

Fixed-price media can fail after being charged. Report the charge and the task state separately.

## Done means

The model or task returned the real output the contract declares, the usage or charge source is identified (organization wallet or provider account), and the user has the model/route, task ID and cost. Never present an accepted submission as a finished artifact.

## References

- [`references/operations.md`](references/operations.md) — operations, scopes, direct calls, convenience commands, HTTP paths
- [`references/access.md`](references/access.md) — access paths, credential rules
- [`references/costs.md`](references/costs.md) — token vs fixed pricing, reservations, media settlement
- [`references/feedback.md`](references/feedback.md) — reporting wrong guidance
