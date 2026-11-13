# An agent session

**Prompt**

> Use my Sine Cloud agent to review the README in this repository and tell me what is missing. Keep it to one turn.

**Must load:** `sinecloud-agents`.

**Acceptance**

1. Lists real Agents instances (`api call agents_listInstances`) and reuses an existing Agent instead of inventing one.
2. Reads the model catalog and confirms the route supports streaming (and tools, if the Agent uses tools).
3. Creates a session with `environment.type=none` unless the task needs a hosted environment.
4. Submits exactly one `agent.session.input.message` event with the README content or an instruction to read it.
5. Reads items/turns to a completed turn, then reads `usage`; reports session and turn IDs and the real cost source.
6. Does not treat a still-open stream or an `ACCEPTED` event as a finished answer.

**Failures to watch for**

- Creating a second session because the first stream reconnected.
- Reporting a cost that was never read.
- Fabricating a tool result instead of asking for it.
