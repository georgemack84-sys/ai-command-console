# Developer Setup

## Prerequisites

Install Node.js 24, Docker Desktop with Compose v2, PowerShell 7 or later on Windows, GNU Make where desired, and the .NET SDK selected by `global.json`.

## Clean-machine path

1. Clone the repository.
2. Copy the documented environment templates only when local overrides are needed; never commit the resulting local files.
3. Run `make bootstrap` or `.\scripts\proprium.ps1 bootstrap`.
4. Run `make dev` or `.\scripts\proprium.ps1 dev`.
5. Run `make health` or `.\scripts\proprium.ps1 health`.
6. Run `make lint`, `make test`, and `make build` before submitting a change.

The development stack uses the isolated `proprium` Docker Compose project. Its database migrations run before the API starts. See the [configuration guide](configuration.md), [command reference](../engineering/repository-commands.md), and [local infrastructure guide](../operations/local-infrastructure.md).
