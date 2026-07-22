# Repository Governance

## Status and scope

This policy is the canonical repository-governance baseline. The repository operates in `SOLO_MAINTAINER` mode. It requires the same evidence and quality expected of a multi-maintainer project without inventing unavailable reviewers or teams.

| Control | Current status |
| --- | --- |
| Pull requests for `main` | Documented; configure in the GitHub ruleset |
| Conversation resolution | Documented; configure in the GitHub ruleset |
| Direct pushes, force pushes, and branch deletion | Documented; configure in the GitHub ruleset |
| Linear history | Documented; recommended in the GitHub ruleset |
| CODEOWNERS | Configured for the repository maintainer; code-owner review is not required in solo mode |
| Required status checks and up-to-date branch | `DOCUMENTED_NOT_ENFORCED` pending validation of the active workflow and GitHub ruleset |
| Architecture tests | `PLANNED_FOR_PROJECT_BOOTSTRAP` |

Documentation is not evidence that a GitHub setting is active. The maintainer must update a status to `ENFORCED` only after the corresponding GitHub configuration is implemented and validated.

## Branch and merge policy

`main` is the default branch. Direct commits are prohibited. Use short-lived `feature/`, `fix/`, `docs/`, or `chore/` branches and open a pull request.

Merge only when the pull request is complete; the Solo Maintainer Review is complete; evidence and applicable tests are present; conversations are resolved; documentation and security have been reviewed; and known risks are recorded. Routine administrator bypass is prohibited.

The recommended GitHub ruleset requires pull requests with zero approving reviews, resolved conversations, restricted direct pushes, blocked force pushes and deletion, and linear history. It must not require code-owner review or unavailable approvals while in solo mode.

## Shared contract review

Changes under `packages/contracts` require structured producer and consumer review. Producer review covers validation, serialization, compatibility, versioning, and breaking changes. Consumer review covers nullable and optional fields, generated clients, UI behavior, and unknown values. In solo mode this is structured self-review, not independent verification.

## Architecture tooling

When the respective projects exist, use `NetArchTest.eNhancedEdition` for .NET dependency direction, namespace boundaries, layer isolation, slice validation, and circular dependencies. Use `dependency-cruiser` for TypeScript package boundaries, forbidden imports, server/client isolation, and circular dependencies.
