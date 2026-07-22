# Coding Workflow

## Daily Loop

```powershell
make doctor
make bootstrap
make dev
make quality
make test
```

## Before Review

Run:

```powershell
make quality
make test
make pre-commit
```

## Branches

Use `feature/`, `fix/`, `security/`, `chore/`, or `release/` prefixes.

## Sensitive Changes

Changes to authentication, authorization, action confirmation, secrets, migrations, Docker, CI, dependencies, backup/restore, external integrations, security headers, or audit behavior require explicit review.
