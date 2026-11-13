---
name: sinecloud-agents
description: |-
  Run Sine Cloud Agents: pick an available model route, create or reuse an Agent, open a session, submit a turn, follow the live event stream, and read saved items, turns and per-session usage.
  TRIGGER when the user asks to build/configure an agent on Sine Cloud, run a task through an agent session, choose or change its model, stream or inspect a response, or find out what a session cost.
  SKIP when the user only needs a one-shot model response (Gateway), a shell command or files without an agent (Box), or a single external tool call (Powers).
---

# Sine Cloud Agents: sessions that answer and call tools

One Agents workspace (instance) holds reusable Agent definitions and sessions. A session belongs to one Agent; a turn is one submitted round of work and may include several model calls and tool calls.

The contract is `https://sinecloud.dev/api/openapi/agents.json`; the generated operation and scope table is [`references/operations.md`](references/operations.md). Never invent an Agent ID, model route, session field or status.

## Before the first call

1. **Scope** — the key needs `agentRun`. Without it every Agents call returns `403`; retrying cannot add a scope.
2. **Instance** — list real workspaces and keep the instance ID; every other Agents call is scoped by it.
3. **Model route** — the model catalog must contain an available route. Agents currently requires streaming text; tools need a route with confirmed tool support.
4. **Balance** — model calls consume organization credits. Read [`references/costs.md`](references/costs.md).

```bash
sinecloud agents list --json | jq '.data[] | {id, name}'
sinecloud agents models list --instance-id "$INSTANCE_ID" --json | jq '.data[] | {id, streaming, tools}'
```

Read `sinecloud api list --product agents --json` when a flag is unclear; it is the authoritative command and parameter surface.

## Run a turn

```bash
# 1. Reuse an Agent, or create one whose configuration names a real model route.
sinecloud agents get --instance-id "$INSTANCE_ID" --agent-id "$AGENT_ID" --json

# 2. Open a session for that Agent. environment.type=none is enough for text-only work.
sinecloud agents sessions create --instance-id "$INSTANCE_ID" --body @session.json --json

# 3. Submit one user message as an input event.
sinecloud agents sessions events post --instance-id "$INSTANCE_ID" --session-id "$SESSION_ID" --body @input.json --json
```

`session.json` needs the Agent reference (`agent_id` or an inline `agent` override) and an environment such as `{"type":"none"}`. `input.json` follows the published input-event contract:

```json
{ "events": [ { "type": "agent.session.input.message",
  "input": [ { "type": "message", "role": "user",
    "content": [ { "type": "input_text", "text": "Summarise this repository's test setup." } ] } ] } ] }
```

- If the Agent uses client-side tools, answer each requested tool with an `agent.session.input.tool_result` event carrying the matching call ID; never invent a tool result.
- To stop work, post `{ "events": [ { "type": "agent.session.input.cancel" } ] }`. Cancelling is a request; confirm the resulting state.

## Read the result

```bash
sinecloud agents sessions events --instance-id "$INSTANCE_ID" --session-id "$SESSION_ID"   # live only, no replay
sinecloud agents sessions items  --instance-id "$INSTANCE_ID" --session-id "$SESSION_ID" --json
sinecloud agents sessions turns  --instance-id "$INSTANCE_ID" --session-id "$SESSION_ID" --json
sinecloud agents sessions turns get --instance-id "$INSTANCE_ID" --session-id "$SESSION_ID" --turn-id "$TURN_ID" --json
```

The event subscription replays nothing: a reconnect starts after it reconnects. The durable record is items and turns. A completed turn is the only evidence of a normal answer; an idle session, a closed tab or a dropped stream proves nothing about the last execution.

## Cost and limits

- Billing follows model tokens. One task may make several model calls when a tool is involved.
- Calls routed through Gateway have a single Gateway billing source; Agents does not charge twice for the same call.
- The per-session usage record is authoritative for that session, and it is not a total for the organization:

```bash
sinecloud agents sessions usage --instance-id "$INSTANCE_ID" --session-id "$SESSION_ID" --json
sinecloud agents sessions attempts --instance-id "$INSTANCE_ID" --session-id "$SESSION_ID" --json
```

- `attempts` includes interrupted model attempts. Usage can exist for a session that was later deleted.
- Input limits are enforced per call: split instructions, history or tool definitions instead of retrying an oversized request.

## Recovery

| Situation | Do |
| --- | --- |
| Stream closed or `UNKNOWN` status | Re-read the same session's turns, items and attempts; keep session, turn and request IDs |
| Submission response lost | Re-read the session's items/turns first; only resubmit the identical input event when you can prove nothing was accepted |
| Tool call requested | Answer with the real tool result and the same call ID; never fabricate |
| Interrupted attempt | Inspect `attempts`, then decide whether the user wants another turn |
| `402` / insufficient balance | Stop; an owner or admin funds the organization |
| `403` missing scope or route | Stop; a key or grant must change, not the request |

## Done means

The session shows a completed turn whose items contain the answer, the usage record is read, and the user has the session and turn IDs plus any real cost. Do not claim a task succeeded from a submitted event, an `ACCEPTED` status or a still-open stream.

## References

- [`references/operations.md`](references/operations.md) — operations, scopes, CLI commands, HTTP paths
- [`references/access.md`](references/access.md) — CLI/SDK/MCP/HTTP setup and credential rules
- [`references/costs.md`](references/costs.md) — reservations, token billing, stop conditions
- [`references/feedback.md`](references/feedback.md) — reporting wrong guidance
