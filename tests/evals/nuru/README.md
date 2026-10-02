# Nuru agent evaluations

This corpus evaluates agent judgment independently from deterministic service tests.

Each specialist owns a view of the shared cases:

- `discovery/`: candidate identification and source signals
- `context/`: project, scope, artifact, and ambiguity
- `connection/`: related, unrelated, cross-project, contradiction, and supersession proposals
- `quality/`: provenance, duplicate, freshness, conflict, and evidence calibration
- `curator/`: fast/standard workflow selection and recommendation synthesis

Run deterministic service tests through the standard unit suite. Add provider-backed agent runs only through an explicit evaluation harness so test outcomes remain reproducible and do not mutate canonical knowledge.
