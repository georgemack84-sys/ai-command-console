# Phase 8 — Conflict Engine Acceptance Matrix

This matrix defines the executable evidence required before Phase 8 can exit. It deliberately treats a proposal, human decision, and executed resolution as distinct immutable records.

| Scenario | Expected governed result | Automated evidence |
| --- | --- | --- |
| A: human correction | `CORRECTION_CONFLICT` → human decision → `SUPERSEDE`; old item remains historical | `tests/unit/learning-constitution/phase8Acceptance.test.ts` |
| B: agent inference against human directive | Proposal may recommend `REJECT`; agent cannot approve or execute | `conflictResolutionPlanner.test.ts`, `conflictAdmissionGate.test.ts` |
| C: bounded exception | `CREATE_EXCEPTION` creates `EXCEPTION_OF`; general rule remains current | `phase8Acceptance.test.ts` |
| Compatible overlap | `MERGE` requires a separate durable result with `MERGED_FROM` links to both sources | `conflictResolutionExecution.test.ts` |
| D: ambiguous suggestion | clarification instead of unauthorized promotion | `conflictWorkflowAndQuery.test.ts`, `conflictResolutionPlanner.test.ts` |
| E: contextual decision | only a scope narrower than the established rule can execute | `conflictResolutionExecution.test.ts` |
| F: uncertain external fact | preserve competing claims and escalate | `phase8Acceptance.test.ts` |
| Related conflicts | impact analysis blocks an unsafe cascade; conflicts can form a set | `conflictSetAndImpact.test.ts` |
| New evidence | creates a reassessment trigger without rewriting history | `conflictReassessmentService.test.ts` |
| Integrity | detect unresolved or internally inconsistent trails without mutation | `conflictIntegrityScanner.test.ts` |

## Required execution evidence

Run `npm run test:noesis:phase8` and `npx tsc --noEmit`. The dedicated command uses Vitest's Node environment and a single fork, avoiding the non-terminating JSDOM/thread combination observed in this workspace. On 2026-08-23, the Phase 8 command completed with **15 test files and 27 tests passing**.

## Exit blockers still requiring implementation proof

- Future durable-promotion entry points must be required to call `PromotionConflictAnalysisService` before admission. The current Noesis-backed workspace promotion path is covered.
