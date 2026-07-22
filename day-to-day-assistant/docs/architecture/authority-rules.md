# Authority Rules Specification

## Levels

| Level | Name | Meaning |
| --- | --- | --- |
| A0 | READ | Retrieve authorized information without changing state. |
| A1 | ADVISE | Summarize, rank, explain, recommend, or plan without binding effect. |
| A2 | PREPARE | Create a draft or proposal with no external effect. |
| A3 | CONFIRMED_ACTION | Execute one explicitly approved action. |
| A4 | DELEGATED_ROUTINE | Execute a predefined routine within strict bounds. |
| A5 | PROHIBITED | Never perform the operation. |

## Material Actions

Creating or modifying external calendar events, sending communications, deleting records, permanently changing user data, creating recurring automation, changing integrations, changing permissions, changing security settings, writing durable sensitive memory, and exporting or sharing personal data are material actions.

## Confirmation Rules

A valid confirmation must be tied to a specific proposal, issued by the authenticated user, time limited, single purpose, replay resistant, invalidated if the proposal changes, and recorded. Generic permission cannot authorize unrelated future actions.

## Action States

DRAFTED, AWAITING_CONFIRMATION, APPROVED, REJECTED, EXPIRED, EXECUTING, COMPLETED, FAILED, UNCERTAIN, ROLLED_BACK, and CANCELLED.

## Authority Matrix

| Capability | Default authority | Confirmation |
| --- | ---: | --- |
| Read tasks | A0 | No |
| Read calendar | A0 | No |
| Search notes | A0 | No |
| Summarize today | A1 | No |
| Recommend priorities | A1 | No |
| Prepare a task | A2 | No execution |
| Draft a message | A2 | No sending |
| Create a local task | A3 | Yes |
| Modify a calendar event | A3 | Yes |
| Send an email | A3 | Yes |
| Run daily briefing routine | A4 | Predelegated |
| Delete audit history | A5 | Prohibited |
| Modify own authority | A5 | Prohibited |
| Make a financial transaction | A5 | Prohibited |

## Fail-Closed Rule

Uncertain operations must not be reported as successful. Missing authority, invalid confirmation, expired tokens, malformed proposals, and ambiguous external outcomes fail closed.
