# Products: what each one does and where its boundary is

| Product | Produces | Resource model | Console-only today |
| --- | --- | --- | --- |
| **Agents** | Model-backed agent sessions and reusable Agent definitions | One Agents workspace (instance) per organization or project; Agents and sessions belong to it | Preparing the workspace, creating the first Agent form, reviewing model calls and costs |
| **Box** | A file space plus command execution; optional Sandbox VM window | A product workspace, then individual `boxId` resources that own files, executions and runtimes | Preparing the workspace, creating a Box, choosing Lite or Sandbox, lifecycle and destruction |
| **Powers** | A single tool call with a published endpoint contract | No instance resource; endpoints come from the platform catalog, BYOK connections are organization resources | Adding/approving BYOK connections |
| **Gateway** | Model and media output | Routes and budgets are organization configuration; nothing per-call is created | Creating routes, setting organization budgets, adding BYOK provider connections |

## Boundaries that surprise agents

- **Agents ≠ Gateway.** Agents selects models through the organization model catalog and calls Gateway internally; a key with `agentRun` does not need `modelInvoke` for that internal call, and it still cannot call Gateway directly.
- **Agents ≠ Box.** An Agent can explicitly link a Box in the same organization and project scope. Linking is optional and grants nothing by itself.
- **Box needs an existing resource.** The API lists and operates boxes; it does not create them. Ask the user to create one in Console and return the `boxId`.
- **Powers endpoints are found, not invented.** Endpoint IDs may contain `#` or `/`; encode the whole ID when it appears in a path.
- **Gateway budgets are organization configuration.** Increasing a budget does not add wallet funds.

## Documentation map

| Topic | Page |
| --- | --- |
| Quickstart and Console orientation | https://docs.sinecloud.dev/quickstart/ |
| Organizations and roles | https://docs.sinecloud.dev/organizations/ |
| API keys and scopes | https://docs.sinecloud.dev/api-keys/ |
| Balance and usage | https://docs.sinecloud.dev/billing/ |
| Agents | https://docs.sinecloud.dev/products/agents/ |
| Box | https://docs.sinecloud.dev/products/box/ |
| Powers | https://docs.sinecloud.dev/products/powers/ |
| Gateway | https://docs.sinecloud.dev/products/gateway/ |
| MCP | https://docs.sinecloud.dev/mcp/ |
| SDK | https://docs.sinecloud.dev/sdk/ |
| CLI | https://docs.sinecloud.dev/cli/ |

Chinese documentation replaces the prefix with `/zh-CN/`.
