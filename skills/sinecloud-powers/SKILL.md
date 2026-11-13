---
name: sinecloud-powers
description: |-
  Call a Sine Cloud Powers tool: find the real endpoint and its input contract, read the quote, submit one explicit run with a stable identity, and read the saved result.
  TRIGGER when the user asks to run a tool or integration on Sine Cloud, list what tools exist, inspect a tool's input schema, use their own provider account, or recover an uncertain tool call.
  SKIP when the user needs model output (Gateway), an agent session (Agents), or a shell/filespace (Box).
---

# Sine Cloud Powers: one tool, one explicit run

Powers is a catalog of tool endpoints. Each endpoint has its own version, input/output contract and price; there is no universal request body. Endpoint IDs may contain `#` or `/` and must be used verbatim.

Contract: `https://sinecloud.dev/api/openapi/powers.json`. Generated operations and scopes: [`references/operations.md`](references/operations.md).

## Before the first call

1. **Scope** — `catalogRead` to discover, `toolRun` to execute, `runRead` to inspect runs, `usageRead` for usage events, `connectionRead`/`connectionWrite` for own-provider connections.
2. **Endpoint** — find the actual endpoint; do not construct an ID from the tool's display name.
3. **Input** — read the endpoint's schema and build the input from it. The complete request is limited to 64 KiB; `pathParams` values must be strings.
4. **Cost** — read the quote. Platform execution charges the organization wallet; own-provider execution charges the provider account separately.

```bash
sinecloud powers catalog list --json | head -40
sinecloud powers endpoints list --json | jq '.data[] | {id, name, revision}'
sinecloud powers endpoints get --endpoint-id "$ENDPOINT_ID" --json | jq '{input: .inputSchema, price, revision}'
sinecloud powers endpoints quote --endpoint-id "$ENDPOINT_ID" --json
```

## Choose who pays

| Choice | How | What it costs |
| --- | --- | --- |
| Platform execution (default) | Omit the connection | Published platform fee per **successful** call, from the organization wallet |
| Own provider (BYOK) | Pass an organization-owned `connectionId` | Cloud fee can be zero; the provider bills the account |

```bash
sinecloud powers connections list --json
```

Connections are created and approved by an organization owner or admin in Console (**Advanced BYOK**). Never place provider credentials in a command line: `powers connections replace|update` reads them from stdin, not argv. A successful save does not prove the provider accepts the credentials.

## Submit one run

```bash
cat > run.json <<'JSON'
{
  "endpointId": "opoint#suggest",
  "input": { "body": { "query": "sine cloud" } }
}
JSON

sinecloud powers runs create --yes --body @run.json --json
```

- Prefer passing the quote back: `--quote quote.json` and, for platform prices, `--expected-price-version N`. A changed price returns `409` instead of a silent overcharge.
- Pass `--connection-id` only for BYOK. Without it, the run uses platform execution.
- Keep the returned run ID and the exact input. That pair is the recovery identity.

## Read the result

```bash
sinecloud powers runs get --run-id "$RUN_ID" --json
sinecloud powers runs list --json
sinecloud powers usage-events list --json
```

`ACCEPTED`, `RUNNING` and `UNKNOWN` are not success. Read the run record until it reaches a terminal status, and interpret the output by the endpoint's declared output schema — not by what a similarly named tool usually returns.

## Recovery

A tool can modify external data, so a retry is a second real operation.

| Situation | Do |
| --- | --- |
| Run ID known, status unknown | Read that run ID; never create another run to "check" |
| Response lost before a run ID was returned | Inspect `powers runs list` for the intent; if the same submission must be retried, reuse the identical endpoint, input, project and connection, with the same idempotency identity |
| Input missing after a refresh | Reconstruct exactly the original input; recovery records do not store input |
| `409` price/revision conflict | Re-read the endpoint and its quote, then ask the user whether the new price is acceptable |
| `409` binding conflict | Select the binding explicitly; never rely on registration order or failover |
| `402` / `403` | Stop: funding or scope must change |

Leaving the page does not cancel server execution. Cancellation, when offered, is scoped to that run and cannot undo a durable external effect.

## Done means

The run has a terminal record, the output matches the endpoint's declared schema, and the user has the endpoint ID, run ID, chosen payer and the real fee (plus provider charges when BYOK). Report an uncertain call as uncertain.

## References

- [`references/operations.md`](references/operations.md) — operations, scopes, CLI commands, HTTP paths
- [`references/access.md`](references/access.md) — access paths, credential rules
- [`references/costs.md`](references/costs.md) — platform vs provider billing, reservations, stop conditions
- [`references/feedback.md`](references/feedback.md) — reporting wrong guidance
