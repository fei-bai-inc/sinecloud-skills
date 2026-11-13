# Skill feedback

Use this when this Skill gave wrong or outdated guidance — a missing operation, a wrong flag, a stale price note — not for account, billing or product support. Account and product questions belong to support@sinecloud.dev.

GitHub issues on this repository are public. Draft first, show the exact title and body to the user, and submit only after they approve. Agreeing to send feedback is not approval of the text.

## Never include

- API keys, provider credentials, tokens, passwords, cookies;
- organization, project or resource identifiers that identify a customer;
- private hostnames, internal URLs, customer data, logs.

Describe the problem in general terms instead.

## Steps

1. Ask whether the user wants to report the problem to the maintainers. If not, continue the task.
2. Identify the exact file and section: `SKILL.md` > section, or `references/<file>.md` > section.
3. Draft a GitHub issue using the table below.
4. Show the draft and ask for an explicit yes.
5. After approval, create the issue on `fei-bai-inc/sinecloud-skills` (for example `gh issue create --repo fei-bai-inc/sinecloud-skills`). Title format: `skill-feedback: <skill-name>: <summary>`.
6. Share the URL. If creation fails, give the user the approved title and body plus the repository's new-issue link.

## Issue body

| Field | Value |
| --- | --- |
| Type | `bug` (incorrect guidance), `outdated`, `missing`, or `improvement` |
| Skill | e.g. `sinecloud-box` |
| Source | File and section |
| Agent | Agent and model in use, if known |
| Task | What the user was trying to do |
| Expected | What should have happened |
| Actual | What the Skill said, or the error returned (redacted) |
| Impact | Effect on the task |
