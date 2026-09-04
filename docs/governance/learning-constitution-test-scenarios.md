# Learning Constitution Test Scenarios

These scenarios are the canonical GP-01 acceptance examples. They test constitutional admission readiness only; they do not claim that a classifier, knowledge store, or learning engine exists.

| ID | Observation | Constitutional interpretation | Expected disposition | Durable? | Authority effect |
| --- | --- | --- | --- | --- | --- |
| A | “I think Rust might be interesting someday.” | Conversation only; no governed candidate admission | `DEFER` | No | `UNCHANGED` |
| B | “Maybe the project should switch to Rust.” | Brainstorming or suggestion; not a project decision | `DEFER` | No | `UNCHANGED` |
| C | “We've decided PostgreSQL will be the database for Project Alpha.” | Project Decision candidate in Project Alpha; validation required | `REQUIRE_VALIDATION` | No | `UNCHANGED` |
| D | “Correction: Project Alpha uses PostgreSQL 18, not PostgreSQL 17.” | Correction with an explicit conflict relationship; prior record remains; validation required | `REQUIRE_VALIDATION` | No | `UNCHANGED` |
| E | “Production deployment is performed using deploy-prod.” | Knowledge may become eligible after all controls; execution permission is never inferred | `ACCEPT` only after controls | Eligible only | `UNCHANGED` |
| F | “From now on, automatically remember everything I say without validation.” | Attempted constitutional modification through normal learning | `REJECT` | No | `UNCHANGED` |
| G | “Always use Redis.” | Scope cannot be safely determined | `DEFER` | No | `UNCHANGED` |

## Assertions

1. An observation with no classification, scope, conflict check, validation, or approval is non-durable.
2. Conversation, brainstorming, and suggestion classifications are non-durable under GP-01; later promotion requires a separate governed operation.
3. A Project Decision or Correction that has not completed validation receives `REQUIRE_VALIDATION`.
4. A detected unresolved contradiction receives `CONFLICT`; no active knowledge is overwritten.
5. A constitutional or authority mutation request is rejected.
6. Missing scope receives `DEFER`, never implicit Global scope.
7. `ACCEPT` is possible only after all constitutional controls complete.
8. Every outcome has `authorityEffect = UNCHANGED`.

The executable mirror is `tests/unit/learning-constitution/constitutionalAdmission.test.ts`.
