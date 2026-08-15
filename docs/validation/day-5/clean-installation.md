# Day 5 Clean Installation Record

## Identity

- Platform: Windows 11 with PowerShell 7
- Executed revision: `7153f163539ddcf8790d293f9e385c1585fb4e48`
- Date: 2026-08-14 (America/New_York)
- Detailed immutable record: [GP-16 clean-machine evidence](../gp-16-clean-machine.md)

## Start state

The certification worktree began without root or frontend dependency trees,
Proprium environment files, Proprium containers or volumes, or developer-specific
aliases. Git, Node.js, npm, .NET, Docker/Compose, and PowerShell were installed as
baseline workstation tools.

## Executed path

The observed run covered prerequisite verification, locked restore, source
validation, infrastructure-independent tests and builds, Docker image validation,
fresh migrations, 58 integration tests, OpenAPI generation, full-stack startup,
health, guarded database reset, migration reapplication, and cleanup.

## Freshness assessment

GP-17 is based directly on the executed revision. Its changes are confined to
qualification documents, semantic evidence validation, command registration, and
documentation links. The full GP-17 source and qualification gates are rerun in
the final worktree; no application, infrastructure, migration, OpenAPI, or health
implementation differs from the clean-installation revision.

## Final state

All disposable certification containers, networks, and volumes were removed.
The unrelated `ai-command-console-postgres` container was not modified. Generated
dependency and build output remained ignored, and no environment file or secret
was created in the checkout.

`CLEAN INSTALLATION: PASS WITH DOCUMENTED PLATFORM LIMITATIONS`
