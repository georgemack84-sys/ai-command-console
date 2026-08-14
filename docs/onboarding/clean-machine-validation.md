# Clean-Machine Validation

## Definitions and boundary

A **Clean machine** has supported baseline tools installed but no Proprium clone,
containers, volumes, environment files, aliases, or private setup notes. A **Clean clone**
is a new checkout on a configured workstation. GP-16 certifies the clean
clone and full application lifecycle on Windows 11 with PowerShell 7; GitHub's
Ubuntu runner independently certifies the Unix-like CI path. Installing operating
systems or workstation software is outside repository automation.

The execution record belongs in
[`docs/validation/gp-16-clean-machine.md`](../validation/gp-16-clean-machine.md).
Record failures before correcting documentation or tooling, then repeat the
affected phase from a clean point.

## Certification procedure

Use a new checkout and do not copy `node_modules`, build output, `.env` files,
containers, volumes, or generated artifacts from another checkout.

1. Verify the checkout and absence of submodules:

   ```bash
   git status --short
   git submodule status
   ```

2. Verify the complete prerequisite set:

   ```bash
   npm run repo -- doctor
   ```

3. Review the [configuration guide](configuration.md). Create ignored environment
   files from templates only if overriding defaults. Never copy secrets from a
   previous checkout.

4. Restore locked dependencies without starting infrastructure:

   ```bash
   npm run repo -- bootstrap
   ```

5. With no Proprium containers running, prove build-time independence:

   ```bash
   npm run repo -- format check
   npm run repo -- validate
   npm run repo -- build
   npm run repo -- test
   ```

   Before `build`, provide the four non-secret `NEXT_PUBLIC_*` values from
   `apps/web/.env.example` through the current process. Do not create an environment
   file for this independence check.

6. Validate Docker configuration and images:

   ```bash
   npm run repo -- validate docker
   ```

7. Start dependencies and apply the authoritative migrations:

   ```bash
   npm run repo -- migrate
   ```

8. Build and run the full stack, then verify all health contracts:

   ```bash
   npm run repo -- dev
   npm run repo -- health
   ```

9. Run the classified integration suite after its Release build:

   Load every value from `services/api/.env.example` into the current process;
   the API does not auto-load that inventory file. Override `POSTGRES_PORT` and
   `REDIS_PORT` when the isolated Compose project uses alternate host ports.

   ```bash
   dotnet build services/api/Proprium.IntegrationTests/Proprium.IntegrationTests.csproj --configuration Release --no-restore
   npm run backend:test:integration
   ```

10. Validate CI-owned OpenAPI generation after the API Release build:

    ```bash
    dotnet build services/api/Proprium.Api/Proprium.Api.csproj --configuration Release --no-restore
    npm run repo -- validate openapi
    ```

11. Exercise the [local database reset](../operations/database-reset.md) only on
    the isolated certification project, confirm health afterward, then stop and
    remove its disposable resources.

12. Run the repository documentation contract and check the checkout:

    ```bash
    npm run validate:documentation
    git status --short
    ```

Generated ignored output is permitted. Tracked files must remain unchanged.

## Safe recovery scenarios

Certify at least three reversible cases without damaging workstation-wide state:

- run `reset-db` without confirmation and verify it refuses to mutate state;
- point an isolated health request at an unused port and verify failure is non-zero;
- use a unique Compose project and host ports to prove fresh migrations and reset;
- validate an intentionally invalid frontend configuration with the repository's
  existing failure fixture;
- stop only a disposable certification service, inspect diagnostics, and restore it.

Do not stop unrelated containers, delete shared caches, change global runtime
versions, or terminate unidentified port owners merely to manufacture evidence.

## Pass criteria

Certification passes only when the documented sequence succeeds without hidden
commands, required health checks pass, destructive behavior remains explicit,
tracked files remain unchanged, deviations are recorded, and the evidence contains
the exact candidate tree, platform, runtime versions, commands, results, and final
status.
