# GP-27 Configuration Architecture Foundation

## Outcome

[ADR-0010](../architecture/ADR-0010-configuration-architecture.md) is the canonical configuration decision for Proprium. GP-27 standardizes the already-compliant application boundaries and adds a fail-closed source policy; it does not duplicate the later GP-28 through GP-36 implementation scope or change runtime precedence.

## Repository audit

| Surface                         | Existing mechanism                                                                                              | Classification         | Disposition                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| API startup                     | `Program.cs` composes providers; `ApiConfiguration.Resolve` validates a typed snapshot before `builder.Build()` | Compliant bootstrap    | Preserve; framework options convergence belongs to GP-31/GP-33                                                         |
| API consumers                   | Narrow `IOptions<T>` or owned option records                                                                    | Compliant consumption  | Mechanically prevent broad provider dependencies outside API bootstrap                                                 |
| API OpenAPI export              | Deterministic in-memory non-secret inputs added in `Program.cs`                                                 | `APPROVED_EXCEPTION`   | Tool bootstrap only; never a runtime precedence layer or secret transport                                              |
| API integration tests           | Direct environment reads select disposable PostgreSQL, Redis, and origin inputs                                 | `APPROVED_EXCEPTION`   | Test-orchestration boundary; consolidate typed fixtures in GP-36 if retained                                           |
| Web runtime/build               | `environment.ts` explicitly reads public keys, Zod validates them, and `application.ts` exposes derived values  | Compliant bootstrap    | Preserve; GP-30 owns the complete frontend contract                                                                    |
| Web test setup/browser scripts  | Test-local `process.env` values                                                                                 | `APPROVED_EXCEPTION`   | Deterministic test bootstrap, non-production and non-secret except live credentials read only by the owning harness    |
| Templates and settings          | Three owned templates; API `appsettings.json` contains application identity only                                | Compliant source       | GP-28/GP-29 own later template evolution                                                                               |
| Secret controls                 | Ignored local files, placeholder validation, public-name scanning, and redacting API records                    | Compliant isolation    | GP-35 owns external-provider and complete leak-prevention evolution                                                    |
| Root legacy application scripts | Direct process configuration in the transitional command-console surface                                        | `DEFER_TO_ASSIGNED_GP` | Outside the two Proprium executables in GP-27; migrate under the legacy retirement roadmap, not opportunistically here |
| Build and static gates          | Backend compile and frontend type/architecture checks require no runtime services                               | Compliant separation   | GP-34 supplies dedicated mechanical proof                                                                              |

The audit found no Proprium production business service reading raw environment values or depending on `IConfiguration`, no browser-secret module, and no compilation-triggered infrastructure initialization. There is therefore no `REMEDIATE_NOW` runtime violation. Exceptions above are narrow bootstrap infrastructure and do not authorize application-layer use.

## Enforcement

Run:

```text
npm run validate:configuration-architecture
```

The gate checks the API and frontend source boundaries, bootstrap ordering, typed/frozen validated outputs, the ADR contract, and five controlled failures. It complements rather than replaces template, secret, frontend dependency, backend layer, build, and later full configuration-suite checks.

## Exit gate

The accepted decision now answers where configuration originates, where it enters each executable, how it becomes typed and validated, who may consume it, what is public or secret, why builds remain infrastructure-independent, and how future providers can be introduced without consumer redesign. Later configuration game plans have an explicit contract and require an ADR amendment to diverge.
