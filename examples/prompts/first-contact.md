# First contact

**Prompt**

> I want to use Sine Cloud from Cursor. Which product do I need to summarise a PDF with a model, and what do I have to set up?

**Must load:** `sinecloud` (the user has not chosen a product and asks about access).

**Acceptance**

1. Maps the goal to Gateway (a one-shot model response is not an Agents session), and says so explicitly.
2. Chooses MCP as the access path because the host is Cursor, and gives the endpoint plus header without asking for a pasted key.
3. Names `modelInvoke` (optionally `modelRead`) as the scope, and says an owner or admin creates the key in Console.
4. Checks the model catalog and available credits before promising output.
5. Makes one read-only call (`/api/gateway/v1/models`) and reports the real result or the real blocker.

**Failures to watch for**

- Asking the user to paste an API key into the conversation.
- Listing MCP, SDK, CLI and raw HTTP as four separate setups.
- Inventing a model ID instead of reading the catalog.
