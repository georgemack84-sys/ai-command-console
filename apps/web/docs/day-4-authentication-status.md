# Day 4 frontend authentication status

Implementation status: **implemented — locally verified**.

Independent verification status: **published and CI verified — independent review waived by repository owner**.

Certification status: **certified — repository-owner waiver recorded**.

## Implemented foundation

The frontend has one canonical credentialed request boundary, method-based
`X-Proprium-CSRF: 1` attachment, `204 No Content` support, Problem Details and
`401`/`403` classification. Identity is initialized only from `/api/v1/auth/me`.
The authentication provider uses request invalidation to prevent stale results
from restoring a logged-out session. Protected routes enter through the opaque
cookie admission proxy and render only a neutral resolution experience until
the provider has validated the current user.

The implementation also includes the canonical return-path validator, login
experience, permission helpers and gate, accessible user menu, and logout.

## Permission workstream

The local permission API signatures have been inspected. `hasPermission`,
`hasAnyPermission`, `hasAllPermissions`, and `PermissionGate` accept the
generated `PermissionKey` type rather than `string`. This preserves the
consumer boundary needed for a generated catalog.

The local catalog is now deterministically generated from
`services/api/Proprium.Domain/Identity/PermissionCatalog.cs`. Local inspection
also confirmed canonical RBAC entities, catalog validation, seeding, and
effective-permission resolution in `services/api`. Generation drift fails
validation, and a TypeScript-AST validator with intentional failing fixtures
rejects direct literals, concatenation, templates, assertions, local maps,
route metadata, re-exports, and bracket access.

The permission workstream is locally certified. Independent certification still
requires review of this implementation and its backend authority on an
accessible branch. The canonical authority supplies:

1. the backend permission catalog and deterministic exporter;
2. committed generated output at `src/generated/permission-catalog.ts`;
3. drift validation and a closed `PermissionKey` union;
4. type-aware enforcement of handwritten permission bypasses; and
5. intentional failure fixtures covering literals, concatenation, assertions,
   local maps, metadata, and re-exports.

The generated output is committed and consumer signatures use the generated
union. Replacing or extending the backend catalog does not require consumer
signature changes.

## ADR correction

The prior consolidated roadmap incorrectly cited ADR-009 for the session-cookie
contract. ADR-009 remains the design-tokens decision. The frontend cookie
dependency is defined by [ADR-013](adr/ADR-013-authentication-boundary.md),
which references the backend authentication and session design. Middleware
exact-matches the canonical `__Host-proprium_session` name and checks only
presence and maximum length; it does not parse or authenticate the cookie.

## Local certification evidence

The local exit gate now includes initial HTML and RSC inspection, delayed
`/auth/me` hydration, safe browser-back behavior after logout, the opaque
cookie admission matrix, concurrent-`401` invalidation and no-replay tests,
route- and shell-level authorization tests, semantic transport and permission
fixtures, backend origin/CSRF integration evidence, login Axe coverage, and a
Storybook state matrix with passing interaction and Axe tests.

Independent human review was waived by the repository owner because no
separate repository collaborator was available. This is a waiver, not evidence
of a completed independent review. No upstream permission-generator, local
validation, or CI blocker remains.

## Validation provenance

This workspace independently executed the local frontend gate: formatting,
permission generation and semantic fixtures, transport governance fixtures,
type checking, linting, dependency architecture validation, 60 unit tests, and
a production frontend build with the required public environment values and
`NODE_ENV=production`. Storybook builds with the authentication state matrix,
and its three overlay interaction/accessibility checks pass.

Browser assertions now cover the no-cookie protected-route redirect, login responsiveness, password
visibility, and login Axe scan. The Windows runner now owns the temporary Next
server directly, closes the browser, initiates scoped process-tree cleanup, and
exits with the assertion result; browser validation completes cleanly.

Browser certification executes 14 assertions. It confirms that initial
protected HTML and RSC output for an admitted opaque cookie are neutral, that
protected content waits for delayed identity resolution, and that logout cannot
restore the protected route through browser history. The focused backend
authentication integration suite was independently executed locally with the
repository's development configuration and Proprium Postgres/Redis services:
21 passed, 0 failed. The required .NET 8.0.400 SDK is installed.

## Published CI evidence

The published Day 4 review branch passed GitHub Actions repository, frontend,
backend, integration, and Docker validation. PR #7 is ready to merge; its
independent-review requirement was waived by the repository owner.
