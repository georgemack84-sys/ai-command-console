# Dependency Vulnerability Policy

## Merge gate

CI rejects known moderate, high, or critical vulnerabilities in production Node
dependencies for both the repository root and `apps/web`. It also rejects any
known vulnerable direct or transitive NuGet package in `services/api`.

Run the same checks locally after restoring dependencies:

```bash
npm run validate:dependencies
```

The Node checks deliberately use `--omit=dev`. Development-tool findings are
reviewed during weekly Dependabot maintenance, but they do not block a production
release when the vulnerable package cannot enter a runtime artifact. A development
dependency becomes release-blocking if it executes against untrusted input in CI,
is copied into an image, or otherwise crosses that boundary.

Development findings are not silently ignored. The Repository Validation job
compares the full root and web audit reports to
`dependency-audit-exceptions.json`. Every reported advisory and affected package
must match an owned exception with a severity ceiling, exposure analysis,
mitigation, and future expiry. New advisories, expanded package impact, severity
growth, expired approvals, and stale exceptions fail the gate.

## Maintenance

Dependabot checks the root npm graph, frontend npm graph, NuGet packages, GitHub
Actions, and Docker base images every week. Production dependency updates remain
separate from development-tool updates so reviewers can assess runtime impact.
Do not use audit-force upgrades that cross a major version without running the
canonical validation stack.
