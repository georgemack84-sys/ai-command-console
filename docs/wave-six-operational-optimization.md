# Wave 6.4 Operational Optimization

W6.4 establishes Operational Optimization as the read-only analytical layer that turns operational telemetry into deterministic, evidence-backed observations for Mission Control advisory generation.

The phase detects bottlenecks, measures resource utilization, evaluates workflow efficiency, analyzes performance trends, and generates immutable optimization evidence. It does not recommend, prioritize, approve, execute, orchestrate, schedule, allocate resources, or autonomously optimize.

## Runtime Contract

- `types/wave-six-operational-optimization.ts` defines the doctrine, result, finding, evidence, boundary, readiness, and validation contract.
- `services/wave-six-operational-optimization/index.ts` consumes W6.1, W6.2, and W6.3, then produces deterministic observations and analysis reports.
- `app/api/wave-six-operational-optimization/*` exposes authenticated contract, validation, observation, bottleneck, analysis, evidence/report, boundary, and readiness routes.

## Qualification Rules

- Operational observations must be recorded, correlated, and replayable.
- Bottleneck findings must include evidence and replay references.
- Resource, workflow, and performance analyses must be deterministic and reproducible.
- Every finding must include immutable evidence, metric lineage, observation lineage, confidence metadata, and replay validation.
- Recommendation generation, decision making, approval workflows, runtime execution, scheduling changes, resource allocation, and autonomous optimization are prohibited.

## Exit Evidence

The unit suite verifies doctrine publication, deterministic replay, W6.1/W6.2/W6.3 consumption, observation replay, bottleneck detection, resource/workflow/trend analysis, immutable evidence, Mission Control advisory readiness, conditional degradation, and hard constitutional failures.
