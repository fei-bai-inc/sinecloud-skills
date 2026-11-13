# Costs: reservations, charges and stop conditions

Execution is paid from the **organization wallet**. Free access, request rate limits and concurrency limits are different things and none of them grant calling balance.

## Balance and reservations

- `available credits = total balance − current reservations`
- A **reservation** holds credits before the final charge is known. Reserved credits cannot fund another call.
- A **charge** is posted only after a trustworthy result settles. Unused reservation is released.
- Sales, refunds and grants credit the organization fixed in the order, not the paying account's current organization.

Because a reservation exists before work finishes, "no charge visible yet" never means free. A successful-looking response, a timeout, or a lost connection can all leave credits reserved for reconciliation.

## How each product is measured

| Product | Measurement | What that means for the agent |
| --- | --- | --- |
| Agents | Model-call tokens | One task can make several model calls. Calls routed through Gateway have a single Gateway billing source; Agents does not charge a second time for the same call. |
| Box Lite | Command wall-clock duration | Each explicit command reserves at its timeout, then settles on verified duration. |
| Box Sandbox | Confirmed VM runtime-window duration, including idle time | Start, extend or pause the window explicitly. Commands inside a funded window are not charged again. |
| Powers | Platform fee per successful tool call | Own-provider (BYOK) calls bill the provider account separately; the Cloud fee can be zero, total cost is not. |
| Gateway managed | Token pricing, or a published fixed price per successful request/task | Fixed-price asynchronous media is charged when the provider accepts submission; later failure or cancellation does not automatically refund it. |
| Gateway BYOK | Zero Cloud invocation service fee | The provider still charges. |

Never add tokens, milliseconds and tool-call counts together. Cache and reasoning tokens are breakdowns, not extra total tokens. Historical charges keep their original price.

## Guardrails before spending

1. Read the price the product returns rather than quoting one from this Skill or from memory.
2. **Box:** read the runtime quote before starting or extending a Sandbox window; the estimate is not a locked price.
3. **Powers:** read the endpoint quote, then pass the returned price version if the client supports expectations; a changed price must return a conflict instead of silently charging more.
4. **Gateway:** check the route and any organization budget before sending; raising a budget does not add wallet funds.
5. Ask for explicit intent before any paid action that was not already requested, including reruns.

## Stop conditions

Stop and report instead of retrying when you see:

- insufficient available credits, or a refund freeze on the organization;
- `403` for a missing scope or entitlement — the key cannot be widened by retrying, only by an owner/admin issuing a new key or grant;
- `409` for a changed price, revision or idempotency conflict — re-read the record, do not resubmit blindly;
- a suspended or expired organization, resource or subscription;
- an absent route, runtime window, connection or approval.

## Uncertainty

Timeouts, interrupted streams and unknown outcomes can still incur cost. Keep the original request identity — run ID, execution ID, lease ID, session ID, turn ID or the CLI resume ID — and re-read that record. Do not repeat the work with a new identifier to try to release a reservation; that adds a second charge instead of settling the first.

Work already admitted follows the product's execution and settlement rules even if the client disconnects. Closing a page, cancelling a subscription or revoking a key does not retroactively cancel admitted work.
