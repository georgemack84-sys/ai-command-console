# Program 6 - P6.18 Program Qualification

P6.18 formally qualifies the Civitas Proving Ground as the constitutional proving authority for the Civitas ecosystem.

## Scope

- Owns program qualification, proving qualification, proving authority verification, qualification governance, qualification evidence, and the final qualification decision.
- Consumes every previous Program 6 phase and cross-program qualification evidence from Programs 1-5.
- Verifies implemented capabilities only; it does not execute proving, simulations, replay, benchmarking, exercises, federation, or certification.

## Constitutional Rule

Program Qualification requires complete artifacts, immutable evidence, deterministic replay and proving, complete federation/readiness/certification rehearsal evidence, independent traceability, cross-program verification, governance approval, Program 5 safety and trust verification, and reproducible qualification decisions.

## API Surface

- `GET /api/proving-program-qualification/contract`
- `POST /api/proving-program-qualification/validate`
- `GET|POST /api/proving-program-qualification/domains`
- `GET|POST /api/proving-program-qualification/report`
- `GET|POST /api/proving-program-qualification/evidence`
- `GET|POST /api/proving-program-qualification/traceability`
- `GET|POST /api/proving-program-qualification/cross-program`
- `GET|POST /api/proving-program-qualification/approval`
- `GET|POST /api/proving-program-qualification/decision`
- `GET|POST /api/proving-program-qualification/readiness`
