# Evidence

Each evaluation run records what actually happened, not what should have happened. One file per run:

```json
{
  "date": "2026-11-13",
  "commit": "<this repository's commit>",
  "agent": "claude-code / gpt-5.x / cursor …",
  "skills": ["sinecloud-agents"],
  "prompt": "examples/prompts/agents-turn.md",
  "with_skill": { "triggered": true, "steps": ["agents list", "models list", "sessions create"], "terminal_state": "completed turn", "cost_source": "agents session usage", "notes": "" },
  "without_skill": { "triggered": false, "outcome": "invented an endpoint", "notes": "" },
  "verdict": "pass"
}
```

Rules:

- Redact organization, project, instance, box, run and session identifiers; keep only shapes such as `instance_…` or `run_…`.
- Never include keys, tokens, provider credentials or raw outputs that contain them.
- A run is only `pass` when every acceptance item in the prompt file was observed.
- Keep failed runs. A failed run with a redacted transcript is more useful than a missing one.
- Replace the previous file for the same prompt and agent instead of appending a second one.
