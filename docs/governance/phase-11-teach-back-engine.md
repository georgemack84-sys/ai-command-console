# Phase 11 — Noesis Teach-Back Engine

Teach-back verifies comprehension; it never establishes truth, authority, or durable knowledge. A teach-back has six sections: lesson, rationale, scope, example, counterexample, and uncertainties. It is an immutable evidence artifact.

Significant, security-sensitive, constitutional, conflict-related, and broad-scope lessons require teach-back. The Phase 9 gate defers required lessons until the latest immutable evaluation is `PASS` or `PASS_WITH_UNCERTAINTY`.

Teach-back attempts, evaluations, and human decisions are workspace-scoped append-only records. They link into Phase 7 provenance and Phase 10 audit events. Corrections and retries create new records; no earlier attempt is overwritten.

Generated rationale and examples are never candidate knowledge, durable knowledge, or authority inputs. This is the Phase 11 authority-leakage boundary.
