# GP-16 Developer Onboarding and Clean-Machine Certification

## Documentation architecture

GP-16 reuses the established hierarchy and assigns one owner to each operational
responsibility:

| Responsibility | Authority |
| --- | --- |
| Entry point and shortest path | Root `README.md` |
| Prerequisites and end-to-end setup | `docs/onboarding/developer-setup.md` |
| Configuration, templates, precedence, secrets | `docs/onboarding/configuration.md` |
| Canonical commands and CI reproduction | `docs/engineering/repository-commands.md` |
| Compose services, ports, readiness, logs | `docs/operations/local-infrastructure.md` |
| Migration ownership and application | `docs/operations/migrations.md` |
| Destructive local recovery | `docs/operations/database-reset.md` |
| Failure diagnosis | `docs/operations/troubleshooting.md` |
| Reproducibility procedure | `docs/onboarding/clean-machine-validation.md` |
| Executed evidence | `docs/validation/gp-16-clean-machine.md` |

Component READMEs link back to these authorities and may provide focused details;
they do not establish competing setup or migration workflows.

## Polished scope

The clean-machine contract begins with supported baseline tools installed and
verified. Repository automation does not install an operating system, Git, Node,
.NET, Docker, or PowerShell. Certification exercises a fresh checkout with no
Proprium dependencies, environment files, containers, volumes, or private aliases,
then records exact results. Windows 11/PowerShell 7 is locally certified, while the
GP-15 Ubuntu workflow is the Unix-like execution record. macOS remains uncertified.

The repository contains a retained legacy command-console surface. GP-16 does not
rewrite that application; it makes the current Proprium surface under `apps/web`
and `services/api` unmistakably authoritative for Day 5 developer operations.

Migration application is canonical and implemented. Migration creation is not a
clean-onboarding capability because no repository-pinned `dotnet-ef` tool exists;
the migration guide records the exact ownership boundary and the prerequisite for
authorizing it rather than inventing a global-tool dependency.

## Mechanical enforcement

`npm run repo -- doctor` verifies full-workflow prerequisites against `.nvmrc` and
`global.json`. `npm run repo -- validate documentation` checks the required guide
set, README navigation, command-surface coverage, environment-template inventory,
migration/reset safety language, clean-machine linkage, and evidence shape.

`validate repo` composes that semantic check with the GP-12 repository validator,
which already owns Markdown syntax and internal links, structured text, tracked
files, configuration/template consistency, and secret safety. This keeps GP-16
small while making documentation drift a required CI failure.

## Completion standard

Documentation is executable engineering knowledge. Any change to a command,
configuration value, prerequisite, migration procedure, health contract, or reset
behavior is incomplete until its authoritative guide and mechanical contract agree.
The factual execution record must distinguish locally executed work from the
GitHub-hosted CI result and must never contain secrets.
