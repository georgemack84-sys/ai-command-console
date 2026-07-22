# Contributing

## Branches

Use focused branches:

- `feature/<description>`
- `fix/<description>`
- `security/<description>`
- `chore/<description>`
- `release/<version>`

## Commits

Use conventional prefixes such as `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `security:`, `build:`, `ci:`, and `chore:`.

## Pull Requests

Pull requests must describe the reason for the change, affected modules, tests, documentation updates, security impact, database impact, environment changes, and rollback considerations.

Sensitive changes require explicit review. Sensitive areas include authentication, authorization, action confirmation, secrets, migrations, Docker, CI, dependencies, backup and restore, external integrations, security headers, and audit behavior.

Solo operating mode is defined in `docs/development/solo-operating-addendum.md`. Until a second maintainer exists, PRs may be merged by the repository owner after CI passes and the solo review evidence checklist is completed.

## Tests

Run before review:

```powershell
make quality
make test
```

## Security

Do not commit secrets, `.env` files, private keys, production data, or raw sensitive personal records. Report vulnerabilities using the process in `SECURITY.md`.
