# Mission Control Phase 6K.5 - Visibility Certification Gate

Phase 6K.5 adds the final certification gate for the Phase 6K Operator Visibility Layer.

The gate certifies:

- 6K.1 Truth Dashboard
- 6K.2 Replay Viewer
- 6K.3 Ledger Explorer
- 6K.4 Integrity Status Viewer

Implemented surfaces:

- `types/visibility-certification.ts`
- `services/visibility-certification/index.ts`
- `components/visibility-certification/VisibilityCertificationGateShell.tsx`
- `app/visibility-certification/page.tsx`
- `app/api/visibility-certification/*`
- `tests/unit/visibility-certification/visibilityCertification.test.ts`

Certification behavior:

- Validates surface coverage and required displays.
- Validates read-only authority boundaries.
- Validates tenant isolation, restricted redaction, and fail-closed behavior.
- Validates deterministic visibility results.
- Certifies audit evidence, reports, remediation records, and immutable ledger entries.
- Produces `PASS`, `CONDITIONAL_PASS`, or `FAIL`.

Prohibited behavior remains blocked:

- No truth record mutation.
- No replay artifact mutation.
- No evidence mutation.
- No lineage rewrite.
- No recommendation approval.
- No decision execution.
- No hash repair or recalculation.
- No certification override.
- No governance override.
