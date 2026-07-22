# Definition of Done

This Definition of Done is the standing template for implementation work after the repository foundation is established. Day 1 repository-bootstrap work is complete when its explicit phase qualification checklist passes; it is not blocked by feature-level criteria such as authentication, authorization, accessibility, or observability unless those items are part of the Day 1 deliverable itself.

## Feature

A feature is complete only when acceptance criteria are satisfied, implementation is merged, relevant tests pass, failure paths are handled, authorization behavior is tested, validation is implemented, logging is appropriate, audit requirements are satisfied, documentation is updated, accessibility is reviewed, security impact is reviewed, migrations are included when needed, rollback or recovery behavior is documented, and no critical defect remains open.

## AI Feature Additions

AI-assisted features additionally require prompt versioning, structured output schema, invalid output handling, timeout handling, mock provider tests, source grounding where applicable, authority classification, confirmation behavior, prompt injection analysis, no secrets in context, and clear failure behavior.

## State-Changing Additions

State-changing features additionally require Action Gateway routing, proposal preview, authority validation, confirmation enforcement, idempotency, execution verification, activity record, audit event, uncertain outcome handling, and rollback behavior where feasible.

## Phase

A phase is complete only when every required deliverable exists, acceptance criteria are tested, open critical findings equal zero, high findings are resolved or accepted, documentation is current, build is reproducible, completion evidence is stored, and a phase decision is recorded.
