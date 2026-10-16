# Axiom Time → Axiom OS continuation roadmap

## Outcome

Ship Axiom Time as a local-first mobile time utility whose action boundaries are
defined, checked, and evidenced through the Axiom OS workflow. A command or
future agent may propose an action, but only deterministic code may execute it
after the Owner approves the exact parameters.

## Current baseline

| Area | Status | Evidence |
| --- | --- | --- |
| Time workspace | Complete | Local alarms, timers, stopwatch, horizon, and validated persistence. |
| Approval-first commands | Complete | Typed text/voice commands become proposals before execution. |
| Optional weather | Complete | Owner-provided city, approval gate, validated response, retry, and local cache. |
| Device-local audit | Partial | Bounded audit storage exists; proposal and weather lifecycle coverage must be completed. |
| Android delivery | Partial | Debug and signed release artifacts have been built; final signed rebuild and physical-device qualification remain. |
| iOS delivery | Blocked by environment | Capacitor project exists; archive/device verification requires macOS with Xcode. |
| Axiom OS contract | In progress | Human-reviewed outline is complete; executable `app.ax` awaits the Axiom CLI. |

## Phase 1 — Initialize and validate Axiom OS

**Goal:** turn the reviewed outline into a validated, executable contract.

1. Install the supported Axiom OS CLI on the development machine.
2. Run `axiom init --template local-private-app --agent codex` inside
   `axiom-time`.
3. Run `axiom define --guided` and reconcile its generated outline with
   [contract-outline.md](contract-outline.md).
4. Create or update `app.ax` from the reviewed outline.
5. Run `axiom validate app.ax`, `axiom doctor`, and `axiom simulate-examples`.

**Exit criteria:** all three commands pass and the contract expresses the five
current capabilities: propose action, create alarm, start timer, lookup
weather, and manage existing time state.

**Blocker:** the Axiom CLI is not installed or available in this workspace.

## Phase 2 — Generate and wire deterministic enforcement

**Goal:** use generated TypeScript policy artifacts as the execution boundary.

1. Generate TypeScript artifacts with `axiom generate app.ax --target
   typescript --out generated`.
2. Add a small policy gateway between `ClockDisplay` command confirmation and
   `useTimeWorkspace` mutations.
3. Bind approval records to the intent type, exact parameters, proposal ID, and
   a single-use lifecycle.
4. Route weather access through the same gateway before any network request.
5. Run `axiom verify app.ax --target typescript --out generated --write` and
   commit generated outputs only if Axiom marks them repository source.

**Exit criteria:** direct mutation paths cannot be reached from parsed command
input or a future agent output without a valid Owner approval.

## Phase 3 — Close the audit and policy-test gaps

**Goal:** prove every governed path leaves minimal, local evidence.

1. Record proposal-created, confirmed, and denied events without storing raw
   voice command text or city data.
2. Record weather request, retry, success, and failure lifecycle events using
   non-sensitive identifiers only.
3. Add tests for denied, expired, duplicate, and parameter-mismatched
   approvals.
4. Add Axiom policy simulations for each allow, require-approval, and deny
   path in the contract.
5. Ensure corrupt audit records recover safely and the bounded log cannot block
   a time action.

**Exit criteria:** tests prove that an unapproved or mismatched proposal causes
no local mutation, notification scheduling, cache update, or external request.

## Phase 4 — Mobile reliability qualification

**Goal:** confirm governed behavior holds on real devices, not only in the web
runtime or emulator.

1. Complete the Android scenarios in [../docs/DEVICE-QA.md](../docs/DEVICE-QA.md).
2. Verify notification permission grant, denial, re-grant, app termination,
   device restart, timezone change, and daylight-saving behavior.
3. Verify weather behavior offline, while Render is waking, on a client error,
   and with a cached result.
4. Run an accessibility pass with TalkBack, large text, reduced motion, and
   contrast settings.
5. On macOS, archive the iOS app and repeat the equivalent notification and
   accessibility checks with VoiceOver.

**Exit criteria:** all required scenarios have recorded outcomes; known native
limitations are communicated in the UI and release notes.

## Phase 5 — Release readiness

**Goal:** produce reproducible, signed artifacts and a supportable launch
record.

1. Run formatter, typecheck, unit tests, production build, mobile sync, and
   Axiom verification.
2. Rebuild the signed Android AAB and APK in a session that contains only
   process-scoped signing variables.
3. Verify signatures and record artifact SHA-256 hashes.
4. Confirm the Render adapter health endpoint and allowed-origin configuration.
5. Update the release checklist with artifact versions, test device details,
   known limitations, and rollback instructions.

**Exit criteria:** a signed AAB/APK corresponds to the exact reviewed commit,
all validation gates pass, and no key or password appears in source control,
logs, or public configuration.

## Phase 6 — Controlled expansion (after launch)

Prioritize one capability at a time. For every expansion, update the contract
outline and `app.ax` before code, then add its approval, audit, simulation, and
device-test coverage.

Recommended order:

1. recurring and one-time alarm semantics;
2. optional calendar import with narrow, read-only authorization;
3. additional local ambient signals;
4. any agent-assisted scheduling only as proposal generation, never autonomous
   execution.

## Decision gates

- Do not add an external integration until its data class, broker, approval
  rule, and audit event are in `app.ax`.
- Do not enable an agent to act until it is limited to proposal creation and
  cannot self-approve.
- Do not release a new capability when Axiom validation, policy simulations,
  automated tests, or device qualification fail.
