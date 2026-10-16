# Axiom Time — Axiom OS contract outline

## Purpose

Axiom Time is a local-first time utility for alarms, timers, a stopwatch, a
time horizon, and optional weather context. It may accept natural-language or
voice commands, but those inputs only propose actions. Deterministic code and
an explicit human confirmation decide whether an action executes.

## Actors

- **Owner** — the person using Axiom Time on their device. The Owner may create,
  change, or delete their own alarms and timers.
- **Command parser** — untrusted interpretation code. It may turn a text or
  voice command into a typed proposal; it may not execute an action.
- **Time workspace** — the deterministic local authority that changes alarms,
  timers, and stopwatch state after a valid confirmation.
- **Weather adapter** — an optional, read-only external service. It may receive
  a city supplied by the Owner and return weather context. It may not receive
  alarm, timer, audit, or device data.
- **Native notification broker** — the device-local notification capability.
  It schedules and cancels notifications only for approved alarm changes.

## Data classes

| Data | Classification | Storage and handling |
| --- | --- | --- |
| Alarm, timer, stopwatch state | private device data | Versioned local device storage only. |
| User-entered city | optional external input | Sent only to the configured weather adapter after approval. Cached locally after a successful response. |
| Weather context | optional external context | Cached locally; not used to change time state. |
| Approval and audit events | private device evidence | Bounded device-local audit trail; never exported automatically. |
| Notification permission and scheduling result | device capability state | Used only to provide clear feedback to the Owner. |

## Capabilities and policies

### `propose_time_action`

- Allows the command parser to produce a typed proposal for `CREATE_ALARM`,
  `START_TIMER`, or `SET_WEATHER_LOCATION`.
- Must not mutate state, schedule a notification, or make a network request.
- Must record that a proposal was created when durable audit recording is
  available.

### `create_alarm`

- Requires a valid Owner approval bound to the proposed time and label.
- Allows a local alarm record to be created and a native notification to be
  scheduled.
- Must audit the create request and native scheduling result.
- Denies requests without Owner approval or with malformed time data.

### `start_timer`

- Requires a valid Owner approval bound to the proposed duration and label.
- Allows a local timer record with a duration between 1 minute and 7 days.
- Must audit the create request.
- Denies requests without Owner approval or a duration outside the range.

### `lookup_weather`

- Requires a valid Owner approval bound to the supplied city.
- Allows a read-only request to the configured weather adapter.
- Must validate the response shape before caching it locally.
- Must not retry non-retryable client errors, send other local data, or mutate
  alarms, timers, or notification state.

### `manage_existing_time_state`

- Allows the Owner, through direct local controls, to enable, pause, resume, or
  delete their own alarm, timer, or stopwatch state.
- Must audit deletions and alarm enablement changes.
- Must not be callable by a command parser or future autonomous agent.

## Approval binding

An approval is valid only when all of the following are true:

1. The Owner reviewed the exact typed action and its parameters.
2. The action has not already been confirmed, denied, or expired.
3. The execution target matches the proposed action.
4. The approving actor is the Owner, never a parser, model, or external
   adapter.

## Mandatory audit events

- proposal created, confirmed, and denied;
- alarm created, enabled, disabled, deleted, and native scheduling outcome;
- timer created and deleted;
- weather lookup requested, retried, succeeded, or failed;
- notification permission outcome.

## Prohibited behavior

- No agent, model, parser, adapter, or notification broker may self-approve or
  directly change authoritative time state.
- No automatic export, synchronization, sharing, or advertising use of local
  time state or audit data.
- No external request before an Owner supplies and approves the city.
- No secrets, signing keys, or device identifiers in source control, generated
  Axiom artifacts, logs, or public client configuration.

## Policy simulations to preserve

1. A text command proposes an alarm; without confirmation the alarm is absent.
2. A confirmed alarm is stored locally and produces an audit event.
3. A malformed or expired approval is denied and produces no side effect.
4. A weather request without confirmation is denied before network access.
5. A weather response with an invalid shape is not cached.
6. A future agent observation cannot create, delete, or modify time state.
