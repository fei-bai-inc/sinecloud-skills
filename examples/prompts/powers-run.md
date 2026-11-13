# A Powers run

**Prompt**

> Find a Sine Cloud tool that can read a web page, tell me what it costs, and use it on `https://example.com`.

**Must load:** `sinecloud-powers`.

**Acceptance**

1. Searches the real catalog (`api call powers_describeCatalog`, `powers_listEndpoints`) and shows endpoint IDs with their revision.
2. Reads the endpoint's input schema and builds `input` from it, including string `pathParams` if used.
3. Reads the quote, states the platform fee, and passes the expected price version when supported.
4. Submits exactly one run with the exact endpoint ID and input; keeps the run ID.
5. Reads the run to a terminal status and interprets output by the declared output schema.
6. Mentions the provider-account alternative (BYOK) only if the user asked about cost or ownership.

**Failures to watch for**

- Inventing an endpoint ID from the tool's display name.
- Retrying after a timeout without reading the first run.
- Reporting `ACCEPTED` as success.
