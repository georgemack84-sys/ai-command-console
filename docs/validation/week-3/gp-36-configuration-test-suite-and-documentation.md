# GP-36 Configuration Test Suite and Documentation Validation

## Qualification matrix

| Part II requirement | Existing owner | GP-36 evidence |
| --- | --- | --- |
| Explicit architecture and ownership | GP-27–GP-28 | Architecture/ownership validators and controlled failures |
| Root contract | GP-29 | Exact keys, Compose alignment, parser and placeholder fixtures |
| Browser-public frontend | GP-30 | Exact keys, URL/public-boundary fixtures, frontend CI and artifact scan wiring |
| Typed backend | GP-31 | Consumer alignment, architecture metadata, Backend Validation unit tests |
| Deterministic precedence | GP-32 | Source architecture and `ConfigurationSourceTests` in Backend Validation |
| Fail-fast startup | GP-33 | Failure-category/redaction architecture and backend unit tests |
| Build independence | GP-34 | Composition/CI policy and controlled failures |
| Secret isolation | GP-35 | Tracked-tree, synthetic fixture, frontend/OpenAPI/Docker gate wiring |
| Documentation synchronization | GP-36 | Exact per-owner table comparison plus missing/stale fixtures |
| Single merge gate | GP-36 | `repo -- validate configuration`, CI order contract, binary final result |

## Controlled fixtures

The GP-36 fixture suite proves:

- LF and CRLF parsing, comments, blank lines, hierarchical keys, and empty optional values pass;
- missing `=`, empty keys, lowercase/dashed/spaced names, and duplicate keys fail;
- same-value duplication fails with both line numbers available;
- missing frontend/backend required keys fail;
- invalid or credential-shaped frontend URLs and secret-shaped public names fail;
- backend duplicate keys fail; and
- missing and stale documentation rows fail.

All secret-related inputs are synthetic. Failures report rules, paths, keys, and remediation only.

## Reproduction

```text
npm run repo -- validate configuration
npm run test:repository-commands
npm run test:ci-workflow
npm run validate:repository
```

Domain evidence remains reproducible through `repo -- validate frontend`, `repo -- validate backend`, `repo -- validate openapi`, and `repo -- validate docker` in their documented prerequisite contexts.

## Result

The integrated command emits the final binary state only after every mandatory infrastructure-independent check passes:

```text
PART II — QUALIFIED
```
