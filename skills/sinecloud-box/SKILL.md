---
name: sinecloud-box
description: |-
  Operate a Sine Cloud Box: list the boxes a key can see, read and write workspace files, submit a command with a caller-generated execution ID, open or extend a Sandbox runtime window, and manage backups.
  TRIGGER when the user asks to run a command in a cloud box, upload or download its files, start or extend a Sandbox VM window, inspect an execution, or restore a backup.
  SKIP when the user wants an agent conversation (Agents), a single tool call (Powers), or model output (Gateway); and when no Box exists yet — creating one is a Console action.
---

# Sine Cloud Box: files, commands and runtimes

A Box is an existing resource that owns a workspace, execution history and, for Sandbox, funded runtime windows. The API operates boxes; it does not create them, and a product workspace ID is not a `boxId`.

Contract: `https://sinecloud.dev/api/openapi/box.json`. Generated operations and scopes: [`references/operations.md`](references/operations.md).

## Before the first call

1. **Scope** — `fileRead` is the base (listing, stats, reading); `fileWrite` for write/delete; `boxRun` for commands, runtime windows and backups.
2. **Resource** — list the boxes this key can address and keep the exact `boxId`. If the list is empty, ask for a `boxId` from Console instead of inventing one.
3. **Type** — Lite runs bounded commands and charges wall-clock. Sandbox needs an explicitly started window and charges the window, including idle time.
4. **Balance and price** — read the price endpoint before starting a Sandbox window or submitting paid commands.

```bash
sinecloud api list --product box --json
sinecloud api call boxListBoxes --json
sinecloud api call boxGetPrice --param boxId="$BOX_ID" --json
```

## Files

```bash
sinecloud api call boxReadWorkspaceFile --param boxId="$BOX_ID" --param path=/workspace/notes.txt --json
sinecloud api call boxWriteWorkspaceFile --param boxId="$BOX_ID" --param path=/workspace/notes.txt --file ./notes.txt
```

Listing, deleting and workspace stats follow the same shape; the operation IDs are in [`references/operations.md`](references/operations.md).

- Paths are canonical `/workspace` paths; traversal, backslashes and control characters are rejected.
- `--file` sends raw bytes. For Sandbox, a live window is required for live file access; reading a paused Sandbox does not wake it.
- Deleting requires `fileWrite` and explicit user intent; confirm the exact path.

## Commands

`executionId` is **caller-generated** and durable: it is the identity used to read, cancel and recover the command. Never replace it to retry uncertain work.

```bash
cat > execution.json <<'JSON'
{
  "executionId": "run-20261113-01",
  "command": "pytest -q",
  "cwd": "/workspace",
  "timeoutMs": 120000
}
JSON

sinecloud api call boxSubmitExecution --param boxId="$BOX_ID" --yes --body @execution.json --wait --json
sinecloud api call boxGetExecution --param boxId="$BOX_ID" --param executionId="$EXECUTION_ID" --json
```

- Lite: `timeoutMs` maximum is 120000 ms. Sandbox: maximum 300000 ms and never beyond the remaining funded window.
- `--wait` polls that same execution and never resubmits it. Without `--wait`, keep the `executionId` and read it later; cancelling and listing use the same shape (see [`references/operations.md`](references/operations.md)).
- Access to a history summary is not access to full output. Cancelling a dispatched command needs runtime confirmation; an unknown state means neither stopped nor refunded.

## Sandbox runtime windows

A window is funded for a duration (default 10 minutes, maximum 30) and billed for allocated time, including idle. The `leaseId` is a caller-generated identity for that window; reuse it to extend, and never issue a new start to recover an unknown state.

```bash
echo '{"action":"start","leaseId":"lease-20261113-01","timeoutMs":600000}' > runtime.json
sinecloud api call boxChangeRuntime --param boxId="$BOX_ID" --yes --body @runtime.json --json
sinecloud api call boxGetRuntime --param boxId="$BOX_ID" --json

echo '{"action":"extend","leaseId":"lease-20261113-01","timeoutMs":300000}' > extend.json
sinecloud api call boxChangeRuntime --param boxId="$BOX_ID" --yes --body @extend.json --json
```

- Review the quote and available balance before start or extend; the estimate is not a locked price.
- Pause explicitly when the work ends; a running window keeps charging even after the client disconnects.
- Commands inside a funded window are not charged a second execution fee.
- Reading files or submitting commands never starts or wakes a paused VM.

## Backups

```bash
sinecloud api call boxCreateBackup --param boxId="$BOX_ID" --yes --json
sinecloud api call boxExportBackup --param boxId="$BOX_ID" --param backupId="$BACKUP_ID" --output backup.tar
```

Listing, reading metadata and listing backup files use the same shape and are listed in [`references/operations.md`](references/operations.md).

Creating a backup is paid and requires `boxRun`. Exporting writes a local archive; verify the file exists and its size is plausible before reporting success.

## Recovery

| Situation | Do |
| --- | --- |
| Command response lost / `UNKNOWN` | Re-read the same `executionId`; do not submit a new execution for the same intent |
| Window status unknown | `box runtime list` and read the same `leaseId`; recover, do not start another |
| Cancellation requested | Re-read the execution or lease and confirm the terminal state |
| `409` conflict | Re-read the record; the identity or price changed |
| `403` | A scope is missing (`fileWrite`, `boxRun`); a key change is required |
| Empty box list | The key's project scope or organization is wrong, or no Box exists — create it in Console |

## Done means

The execution or window has a confirmed terminal or active state read from the API, the output is the real recorded result, and the cost is visible in the reservation/charge record. Keep the `executionId` and `leaseId` in the answer; never report "created" for work whose response was lost.

## References

- [`references/operations.md`](references/operations.md) — operations, scopes, direct calls, convenience commands, HTTP paths
- [`references/access.md`](references/access.md) — access paths, credential rules, exit codes
- [`references/costs.md`](references/costs.md) — Lite vs Sandbox measurement, reservations, stop conditions
- [`references/feedback.md`](references/feedback.md) — reporting wrong guidance
