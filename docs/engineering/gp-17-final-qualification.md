# GP-17 Final Qualification and Handoff

## Decision

GP-17 closes Day 5 through evidence, not another engineering subsystem. The
repository retains the GP-01 through GP-16 validators and orchestration as the
implementation authorities. GP-17 adds a small semantic evidence validator and a
traceable qualification package under `docs/validation/day-5`.

The final matrix links each requirement to its owner, implementation, executable
validator, observed result, and evidence. A green label without an executable or
externally observable source is invalid.

## Qualification boundary

The qualified surface is the Proprium Week 1 foundation in `apps/web`,
`services/api`, `docker-compose.proprium.yml`, the Day 5 command/validation
surface, CI, and developer documentation. The retained legacy root application is
not recertified as a Proprium Day 5 product surface.

Qualification uses these states:

- `QUALIFIED`: every required Day 5 domain has implementation and evidence;
- `CONDITIONALLY_QUALIFIED`: only an external limitation prevents conclusive
  non-code evidence; and
- `NOT_QUALIFIED`: a required capability, validation, or reproducible path is
  missing or failing.

## Evidence integrity

Historical runs remain identified by exact revision and external run reference.
The final qualification names the commit containing its record, avoiding a
self-referential hash that would change when written. Git resolves that identity
with `git log -1 --format=%H -- docs/validation/day-5/qualification.md`.

The GitHub-hosted CI record qualifies the immediate GP-16 operational baseline.
GP-17 changes only evidence, semantic evidence enforcement, documentation links,
and command registration. Those differences are validated locally by the same
repository command path; the next pull-request run remains the authoritative
confirmation for the GP-17 commit.

## Mechanical gate

`npm run repo -- validate qualification` checks the five required evidence
records, final status tokens, the seven stable CI gate names, and all sixteen
domain results. `validate repo` includes this gate, so missing or incomplete Day 5
evidence fails both local repository validation and the CI Repository Validation
job.

The validator does not execute expensive infrastructure work or rewrite evidence.
Execution remains owned by the existing static, integration, Docker, OpenAPI,
health, command-parity, and CI mechanisms.

## Handoff rule

Week 2 may begin only from the revision identified in the final qualification
record, using the documented commands and seven stable CI checks. Any later source
change requires its own validation and does not inherit the historical GP-17
result automatically.
