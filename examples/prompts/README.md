# Evaluation prompts

Each prompt is run twice — once with the published Skills installed and once without — and the transcript is graded against the acceptance column. Record results in `examples/evidence/`.

| Prompt | Must load | Acceptance |
| --- | --- | --- |
| [first-contact](./first-contact.md) | `sinecloud` | Picks the right product and access path, names the required scope, checks balance, makes one read-only call |
| [agents-turn](./agents-turn.md) | `sinecloud-agents` | Lists instances and models, creates a session with a real agent, submits one input event, reads the completed turn and usage |
| [box-command](./box-command.md) | `sinecloud-box` | Uses an existing `boxId`, generates a durable `executionId`, reads the execution to a terminal state |
| [powers-run](./powers-run.md) | `sinecloud-powers` | Discovers the endpoint, reads its schema and quote, submits one run, reads the terminal record |
| [gateway-media](./gateway-media.md) | `sinecloud-gateway` | Lists models, submits a media task only after confirming price, polls the same task ID |

Failure-path checks (run with the same Skills installed):

| Scenario | Must happen |
| --- | --- |
| Key without the needed scope | Stop at `403`, name the missing scope, do not retry |
| Organization without available credits | Stop before admitting paid work, point to Billing |
| Response lost mid-write | Re-read the same run/execution/session identity; no second submission |
