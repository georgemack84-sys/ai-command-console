# Day 5 Developer-Onboarding Validation

## Discovery test

The root README routes a developer to one authority for setup, configuration,
commands, infrastructure, migrations, reset, troubleshooting, clean-machine
validation, and Day 5 qualification. The complete path is discoverable without
private notes, chat history, a mandatory IDE, personal filesystem paths, shell
aliases, or production credentials.

| Need | Authority | Result |
| --- | --- | --- |
| Prerequisites, clone, restore, build, startup, tests | [Developer setup](../../onboarding/developer-setup.md) | PASS |
| Variables, ownership, precedence, secrets | [Configuration](../../onboarding/configuration.md) | PASS |
| Stable Unix and PowerShell commands | [Command reference](../../engineering/repository-commands.md) | PASS |
| PostgreSQL, Redis, ports, lifecycle, logs | [Local infrastructure](../../operations/local-infrastructure.md) | PASS |
| Schema ownership and application | [Migrations](../../operations/migrations.md) | PASS |
| Destructive local recovery | [Database reset](../../operations/database-reset.md) | PASS |
| Failure diagnosis and recovery | [Troubleshooting](../../operations/troubleshooting.md) | PASS |
| Reproducibility procedure | [Clean-machine validation](../../onboarding/clean-machine-validation.md) | PASS |

## Operational verification

The GP-16 clean run executed the documented path. GP-17 reruns the semantic
documentation contract, command contract, CI mapping, static validation, builds,
and required infrastructure-dependent domains. Environment names are cross-checked
against all three templates, and internal Markdown links are checked by repository
validation.

The supported local platform is Windows 11 with PowerShell 7. GitHub Ubuntu
validates the Unix-like CI command path. macOS remains unclaimed.

`DEVELOPER ONBOARDING: PASS`
