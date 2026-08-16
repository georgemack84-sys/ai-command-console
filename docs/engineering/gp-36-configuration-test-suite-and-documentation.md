# GP-36 Configuration Test Suite and Documentation

**Status:** Implemented — Part II qualification gate

## Outcome

GP-36 closes Part II by composing the GP-27 through GP-35 controls into one infrastructure-independent repository contract. The stable developer entry point is:

```text
npm run repo -- validate configuration
```

Its low-level equivalent is `npm run validate:configuration`. Both return non-zero on any mandatory contract failure and print `PART II — QUALIFIED` only after the integrated gate passes.

## Roadmap reconciliation

The source game plan was supplied in two complementary attachments: sections 1–55 and sections 55–160. Its examples predate the implemented ownership model. GP-36 therefore qualifies the established contracts instead of reintroducing obsolete ones:

- the backend owner is `services/api`, not the removed `services/platform-api` path;
- the root Proprium contract is the exact eight-key Compose inventory established by GP-29, before the explicit transitional legacy boundary;
- the frontend includes the required `NEXT_PUBLIC_ENVIRONMENT` key established by GP-30;
- the backend includes platform, session, origin, rate-limit, and local-admin keys established by GP-31 through GP-33; and
- the actual provider order is tracked `appsettings.json`, optional environment-specific settings, environment variables, the reserved secret-provider position, then approved non-secret CLI overrides. Safe code defaults are represented by tracked base settings rather than an incidental framework provider.

These are repository-aligned corrections, not scope reductions.

## Canonical contracts

The three templates are `.env.example`, `apps/web/.env.example`, and `services/api/.env.example`. Their local counterparts are `.env`, `apps/web/.env.local`, and `services/api/.env`. Templates must be tracked and trackable; local counterparts must be ignored and untracked.

`scripts/environment-template-parser.cjs` is the one repository parser for the permitted template grammar. It accepts blank lines, comments, and `KEY=value` entries, including empty values. It rejects unsupported syntax and duplicate keys with stable rules and line/previous-line diagnostics. It is intentionally not a shell parser.

`scripts/configuration-contract-policy.cjs` centralizes qualification metadata for the exact root, web, and API inventories. It supports documentation and repository validation only; runtime authority remains the typed frontend/backend implementations.

## Integrated gate

The Part II command runs, in order:

1. exact template, parser, ownership, placeholder, consumer, Git-ignore, and controlled-failure checks;
2. GP-27 configuration architecture and bootstrap-boundary checks;
3. GP-35 tracked-tree scanning and synthetic secret-safety fixtures;
4. GP-34 build-time independence checks and controlled failures;
5. exact template-to-documentation synchronization; and
6. CI/evidence ownership validation for frontend, backend, OpenAPI, and Docker domain gates.

It reuses the canonical domain validators. Backend unit tests remain owned by Backend Validation; production frontend and browser-artifact proof remain owned by Frontend Validation; OpenAPI and Docker artifact proof remain in their dedicated jobs. GP-36 checks that those mandatory merge gates stay wired rather than rerunning expensive builds in the fast repository job.

## Stable diagnostics

| Rule | Meaning |
| --- | --- |
| `CONFIG-002` | Malformed or unsupported template line |
| `CONFIG-003` | Required key missing |
| `CONFIG-004` | Duplicate key, including same-value duplication |
| `CONFIG-005` | Unclassified key or unsafe sensitive placeholder |
| `CONFIG-006` | Frontend public-boundary or URL violation |
| `CONFIG-011` | Configuration documentation drift |
| `CONFIG-PART-II` | Integrated command/CI/evidence regression |

Candidate secret values are never part of diagnostics.

## Documentation contract

The developer [configuration guide](../onboarding/configuration.md) owns the complete reference: template ownership, local setup, architecture, exact precedence, exact variable tables, secret handling, build/runtime separation, CI behavior, future production guidance, troubleshooting, change policy, and the canonical command.

Documentation synchronization parses the exact key rows under Repository Platform, Web Application, and Platform API. A missing template key or stale/unowned documentation row fails CI. Normal repository Markdown validation continues to own links, heading structure, encoding, and tracked-file consistency.

## CI and completion

Repository Validation runs the tracked-tree secret scan first, the Part II command second, and broader repository validation third. The remaining CI jobs supply their established domain evidence without runtime services in build-time jobs.

Part II is qualified only when templates, ownership, typed configuration, precedence, startup validation, build independence, secret boundaries, configuration fixtures, synchronized documentation, and CI ownership all pass. Production vault selection and deployment-provider implementation remain future decisions.
