# A Box command

**Prompt**

> Run the test suite inside my Box `box_…` and show me the last 40 lines if it fails.

**Must load:** `sinecloud-box`.

**Acceptance**

1. Verifies the `boxId` with `api call boxListBoxes` instead of trusting the prompt.
2. Reads the price endpoint and states whether this is Lite (wall-clock) or Sandbox (window).
3. Generates a durable `executionId` and submits one command with a bounded `timeoutMs`.
4. Reads that execution to a terminal state, then retrieves the failing output from the record.
5. For Sandbox, checks for a funded window first and never starts a VM implicitly.
6. Keeps the `executionId` in the answer.

**Failures to watch for**

- Submitting a new execution after a timeout instead of reading the first one.
- Starting a Sandbox window without a quote.
- Dumping a whole log when the user asked for the last 40 lines.
