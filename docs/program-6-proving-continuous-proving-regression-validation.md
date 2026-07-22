# Program 6 - P6.14 Continuous Proving & Regression Validation

P6.14 establishes continuous proving for governed platform, policy, model, application, infrastructure, data, security, and governance changes before operational adoption.

## Scope

- Owns continuous proving, regression validation, continuous simulation, and change impact validation.
- Consumes P6.13 benchmark evidence and the prior proving-chain artifacts.
- Produces continuous validation runs, regression evidence, impact reports, qualification recommendations, validation decisions, and a continuous proving dashboard.

## Constitutional Rule

Missing, conflicting, stale, incomplete, or unverifiable validation evidence never authorizes deployment, certification progression, or operational promotion. Such conditions fail closed.

## API Surface

- `GET /api/proving-continuous-proving-regression-validation/contract`
- `POST /api/proving-continuous-proving-regression-validation/validate`
- `GET|POST /api/proving-continuous-proving-regression-validation/engine`
- `GET|POST /api/proving-continuous-proving-regression-validation/triggers`
- `GET|POST /api/proving-continuous-proving-regression-validation/impact`
- `GET|POST /api/proving-continuous-proving-regression-validation/pipeline`
- `GET|POST /api/proving-continuous-proving-regression-validation/regression`
- `GET|POST /api/proving-continuous-proving-regression-validation/evidence`
- `GET|POST /api/proving-continuous-proving-regression-validation/qualification`
- `GET|POST /api/proving-continuous-proving-regression-validation/decision`
- `GET|POST /api/proving-continuous-proving-regression-validation/dashboard`
- `GET|POST /api/proving-continuous-proving-regression-validation/readiness`
