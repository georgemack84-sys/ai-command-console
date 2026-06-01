# Advisory Evidence Operator Handbook

Status: documented after completion bundle final seal

## Operator Goal

Operators use the advisory evidence lifecycle to inspect advisory state, understand verification posture, review disputes, and confirm seal history without creating runtime authority.

## What Operators Can Inspect

- unified advisory status and risk
- source breakdowns and conflicts
- snapshot export and verification state
- offline review findings
- archive index and archive summaries
- retention policy classification
- lifecycle rollups and lifecycle bundles
- lifecycle bundle verification and review state
- certification gate and certification review state
- completion report and completion review state
- completion export bundle and completion bundle verification state

## What Operators Cannot Do From These Views

- deploy
- retry
- cancel
- rollback
- resume
- approve
- override
- delete
- compact
- import evidence into live state
- mark evidence trusted
- trigger workflow control

## Reading Verification State

Verification status should be read as an integrity statement, not a control statement.

- valid means the verifier reproduced the expected deterministic state
- disputed means evidence exists but conflicts or mismatches were detected
- failed means required evidence was missing, malformed, or unsafe to normalize

## Reading Seals

A seal commit marks a verified lifecycle boundary. It records that the relevant tests, typecheck, lint, and build passed at that point. A seal does not create new runtime behavior.

## Handling Disputes

When a review shows disputed state:

1. Inspect the displayed reasons.
2. Identify whether the dispute is hash, metadata, policy, or authority related.
3. Review the producing service and verification test for the disputed boundary.
4. Do not treat disputed evidence as safe or trusted.

## Handling Failed State

When verification fails:

1. Confirm required evidence fields are present.
2. Confirm the expected policy version.
3. Confirm the artifact was produced by the sealed exporter.
4. Re-run the relevant regression test.
5. Do not import or trust the artifact.

## Replay Mindset

A replayable result is one that can be reconstructed from preserved objects and deterministic hash rules. Replayability supports audit and forensic review, but it does not grant operational control.
