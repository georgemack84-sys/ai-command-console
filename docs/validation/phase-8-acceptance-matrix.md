# Phase 8 — Conflict Engine Acceptance Matrix

This matrix defines the executable evidence required before Phase 8 can exit. It deliberately treats a proposal, human decision, and executed resolution as distinct immutable records.

| Scenario | Expected governed result | Automated evidence |
| --- | --- | --- |
| A: human correction | `CORRECTION_CONFLICT` → human decision → `SUPERSEDE`; old item remains historical | `tests/unit/learning-constitution/phase8Acceptance.test.ts` |
| B: agent inference against human directive | Proposal may recommend `REJECT`; agent cannot approve or execute | `conflictResolutionPlanner.test.ts`, `conflictAdmissionGate.test.ts` |
| C: bounded exception | `CREATE_EXCEPTION` creates `EXCEPTION_OF`; general rule remains current | `phase8Acceptance.test.ts` |
| D: ambiguous suggestion | clarification instead of unauthorized promotion | `conflictWorkflowAndQuery.test.ts`, `conflictResolutionPlanner.test.ts` |
| E: contextual decision | only a scope narrower than the established rule can execute | `conflictResolutionExecution.test.ts` |
| F: uncertain external fact | preserve competing claims and escalate | `phase8Acceptance.test.ts` |
| Related conflicts | impact analysis blocks an unsafe cascade; conflicts can form a set | `conflictSetAndImpact.test.ts` |
| New evidence | creates a reassessment trigger without rewriting history | `conflictReassessmentService.test.ts` |
| Integrity | detect unresolved or internally inconsistent trails without mutation | `conflictIntegrityScanner.test.ts` |

## Required execution evidence

Run TypeScript compilation and the listed test files in an environment where Vitest completes normally. The current workspace's Vitest invocation reaches the runner banner but does not return assertion output, so compilation is recorded separately and test-run completion must be captured before declaring the phase complete.

## Exit blockers still requiring implementation proof

- Automatic candidate analysis must be integrated into every durable-promotion entry point, not only enforced where a durable conflict already exists.
- `MERGE` requires an explicit durable merge artifact and guarded executor semantics.
- The final full-suite test execution result must be captured in a non-hanging runner environment.
