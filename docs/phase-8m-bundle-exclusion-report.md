# Phase 8M.12A Bundle Exclusion Report

Status: active exclusion boundary

Bundle A is intentionally small. Everything below remains outside the stabilization bundle until it receives a separate owner, validation path, and review boundary.

## Excluded Categories

| Category | Approximate Count | Reason Excluded From Bundle A | Next Handling |
| --- | ---: | --- | --- |
| Generated Phase Expansion | 850 | Generated API, service, type, UI, and unit-test expansion is too large and too risky to mix with stabilization evidence. | Bundle B, split by domain. |
| Source Changes | 26 | Runtime, layout, config, service export, and shared type changes require production review. | Bundle C. |
| Non-Phase-8M Documentation | 9 | QCI and other architecture docs are useful but not part of the Phase 8M stabilization proof. | Documentation bundle. |
| Experimental Files | Unknown until successor review | Experimental work cannot be certified without owner and lifecycle metadata. | Defer or archive through governed review. |
| Archive Candidates | Unknown until successor review | Archive decisions are destructive or history-sensitive and must not be bundled with stabilization. | Separate archive review only. |
| Temporary Artifacts | None intentionally included | Temporary files weaken reproducibility and reviewability. | Remove only after explicit approval and path verification. |

## Explicit Non-Staging Rule

Do not run broad staging commands such as:

```text
git add .
git add app services tests types docs
```

Use only the Bundle A pathspecs listed in the stabilization manifest.

## Risk Rationale

The generated expansion and source changes may be valuable, but they are not yet governed by:

- module ownership
- generated-code lifecycle policy
- full unit validation
- production build proof
- architecture index updates
- CI reproducibility evidence

Keeping them out of Bundle A preserves reviewability and prevents a stabilization commit from becoming a hidden feature merge.
