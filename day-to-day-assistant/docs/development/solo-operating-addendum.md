# Solo Operating Addendum

This repository currently operates with one maintainer: `@georgemack84-sys`.

## CODEOWNERS

`CODEOWNERS` uses the real repository owner handle so GitHub review routing is live. Placeholder team handles such as `@proprium-frontend`, `@proprium-backend`, `@proprium-platform`, `@proprium-security`, or `@proprium-architecture` must not be used until those teams exist in GitHub.

When real maintainers are added, replace the single-owner entries with team or area ownership rules and update this addendum.

## Pull Request Approval

Until a second maintainer exists, the repository owner may merge their own pull requests when all of the following are true:

- CI passes.
- The PR description records the reason for change, affected modules, tests, documentation, security impact, database impact, environment impact, and rollback considerations.
- Sensitive changes include explicit written review notes in the PR body.
- Any AI-assisted review output is pasted or linked as evidence, but it is advisory and does not replace owner accountability.

Branch protection should not require independent approval, code-owner approval from multiple owners, or "dismiss stale approval" workflows that make a solo repository unmergeable. Those controls become required when a second human maintainer is available.

## Self-Approval Exception

The normal rule is that authors should not approve their own PRs. In solo mode, this rule is suspended for repository-owner changes and replaced by documented self-review evidence. This exception exists to keep governance executable rather than forcing admin overrides that would weaken the process.

The exception must be removed when another qualified maintainer can review security-sensitive and architecture-sensitive changes.

## Shared Contract Ownership

Shared contract paths, including `packages/contracts`, are owned by the repository owner in solo mode. Future team mode should require both frontend and backend owners for shared contract changes.

## Definition of Done Scope

The general Definition of Done applies to product and platform feature work after the repository foundation is complete. Day 1 bootstrap work is governed by the Day 1 phase qualification checklist. Authentication, authorization, accessibility, logging, observability, and similar feature criteria are not Day 1 blockers unless the Day 1 plan explicitly names them.

## Architecture Tests

Architecture-test tooling is standardized as:

- NetArchTest for .NET project/layer dependency rules.
- dependency-cruiser for TypeScript package and import-boundary rules.

Until these tools are installed and wired into CI, architecture-test requirements are tracked as readiness gaps, not implied passing controls.
