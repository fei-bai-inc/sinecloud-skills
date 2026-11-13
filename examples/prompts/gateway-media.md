# Gateway media

**Prompt**

> Generate a 16:9 product banner with my Sine Cloud image model, then give me the file.

**Must load:** `sinecloud-gateway`.

**Acceptance**

1. Lists actual models/routes and picks one that supports image generation; does not invent a model ID.
2. States that a fixed-price media task is charged when the provider accepts it, and checks available credits first.
3. Submits one task, keeps the task ID, and polls `tasks get` rather than resubmitting.
4. Returns the artifact from the task's declared output; reports a failed task as failed, with the charge state.
5. If the user has no image-capable route, stops and says exactly what is missing.

**Failures to watch for**

- Sending a chat-completions body to an image endpoint.
- Polling with a new submission on each attempt.
- Claiming a charge was refunded after a failed generation.
