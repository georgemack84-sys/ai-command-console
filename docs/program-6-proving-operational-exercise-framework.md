# Program 6 - P6.11 Operational Exercise Framework

P6.11 establishes deterministic operational exercises for validating personnel, governance authorities, procedures, applications, platform services, and cross-program coordination under realistic conditions.

## Scope

- Owns tabletop exercises, mission rehearsals, operator drills, governance exercises, and emergency simulations.
- Consumes P6.10 integration validation and the prior proving-chain evidence.
- Produces exercise reports, operational findings, readiness metrics, executive summaries, recommendations, timelines, replay references, and immutable exercise evidence.

## Boundaries

P6.11 does not own the simulation engine, replay validation, adversarial testing, resilience validation, performance testing, cross-program integration, production operations, operator certification, trust evaluation, or application governance.

## Lifecycle

Exercises progress through Draft, Approved, Provisioned, Prepared, Executing, Completed, Evaluated, Reported, and Archived. Execution is only valid after approval.

## API Surface

- `GET /api/proving-operational-exercise-framework/contract`
- `POST /api/proving-operational-exercise-framework/validate`
- `GET|POST /api/proving-operational-exercise-framework/architecture`
- `GET|POST /api/proving-operational-exercise-framework/registry`
- `GET|POST /api/proving-operational-exercise-framework/tabletop`
- `GET|POST /api/proving-operational-exercise-framework/mission-rehearsal`
- `GET|POST /api/proving-operational-exercise-framework/operator-drill`
- `GET|POST /api/proving-operational-exercise-framework/governance-exercise`
- `GET|POST /api/proving-operational-exercise-framework/emergency-simulation`
- `GET|POST /api/proving-operational-exercise-framework/execution`
- `GET|POST /api/proving-operational-exercise-framework/evaluation`
- `GET|POST /api/proving-operational-exercise-framework/metrics`
- `GET|POST /api/proving-operational-exercise-framework/evidence`
- `GET|POST /api/proving-operational-exercise-framework/reporting`
- `GET|POST /api/proving-operational-exercise-framework/readiness`
