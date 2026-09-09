# GP-45 Repository Content Validation

**Status:** Qualified

## Acceptance evidence

GP-45 establishes one offline repository-health command:

```bash
npm run validate:repository
```

It uses Git's tracked inventory, requires no runtime infrastructure, and aggregates independent failures with stable `RVAL-*` diagnostics.

| Acceptance requirement | Evidence |
| --- | --- |
| Deterministic discovery | Git tracked-path inventory, governed roots, hygiene exclusions, and line-ending policy |
| Markdown integrity | fenced-block, heading, local target, and anchor checks with positive and negative fixtures |
| YAML integrity | parsing and indentation checks; CI workflow structure is enforced as `RVAL-YAML-003` |
| JSON integrity | strict JSON and TypeScript JSON-with-comments parsing |
| Schema-controlled content | explicit schema registry validates the learning taxonomy contract offline |
| Repository integrity | required files, configuration authority, package-manager, backend solution, and generated-artifact policies |
| Unified reporting | rule ID, category, severity, file, optional location, problem, and remediation |
| Exception governance | exact rule/path exemptions require owner, reason, future expiry, and current use |
| CI enforcement | `.github/workflows/ci.yml` runs `npm run repo -- validate repo` and verifies its workflow contract |
| Failure proof | repository fixtures cover valid content and controlled malformed, missing, schema-invalid, link-invalid, and policy-invalid cases |

## Qualification result

The qualified baseline passes `npm run validate:repository`, `npm run repository:fixtures`, and `npm run test:ci-workflow`. New repository-content violations are build-blocking through the canonical command and CI repository-validation job.

## Exception policy

Use `scripts/repository-validation-exceptions.cjs` only for a reviewed, temporary, exact-path exception. Broad exclusions, permanent suppressions, and unused exceptions are rejected.
