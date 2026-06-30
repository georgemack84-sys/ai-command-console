# Mission Control Phase 6K.4 - Integrity Status Viewer

Phase 6K.4 adds the operator-facing Integrity Status Viewer for the Truth Ledger.

The surface is intentionally read-only. It exposes integrity summary, record checks, ledger segment warnings, hash chain state, tamper alerts, verification results, certification gate status, degraded/corrupted analysis, blast radius, dependency impact, and historical integrity status. It does not repair hashes, recalculate hashes, suppress tamper warnings, mutate evidence, rewrite lineage, rerun certification, mark corrupted records valid, execute decisions, or override governance.

Implemented surfaces:

- `app/integrity-viewer/page.tsx`
- `components/integrity-viewer/IntegrityStatusViewerShell.tsx`
- `services/integrity-viewer/index.ts`
- `types/integrity-viewer.ts`
- `app/api/integrity-viewer/*`
- `tests/unit/integrity-viewer/integrityViewer.test.ts`

Governance guarantees:

- Tenant isolation and operator matching fail closed.
- Restricted integrity records are redacted under restricted read and denied under read-only access.
- Corrupted integrity blocks trusted interpretation.
- Hash repair, hash recalculation, tamper suppression, certification override, governance override, evidence mutation, lineage rewrite, and execution actions throw explicit read-only errors.
- Audit events are append-only and source-mutation disabled.
