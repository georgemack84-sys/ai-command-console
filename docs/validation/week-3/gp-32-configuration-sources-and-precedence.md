# GP-32 Configuration Sources and Precedence Validation

**Date:** 2026-08-15
**Result:** PASS

## Review findings

- ASP.NET Core's implicit application-provider set allowed unrestricted command
  line and Development User Secrets, so framework defaults were not sufficient
  evidence of the roadmap contract.
- The OpenAPI command previously appended an in-memory provider after all normal
  providers, creating an undocumented strongest test/tooling layer.
- The API had no backend `.env` loader, production secret provider, or tracked
  environment-specific settings files. Those absences are retained explicitly.
- Compose and CI already supplied API runtime values through environment
  variables and required no consumer redesign.

## Implemented evidence

- `ApiConfigurationSources.Configure` clears incidental application providers and
  adds base JSON, optional environment JSON, environment variables, a reserved
  secret-provider callback, and approved CLI in exact order.
- Program filters CLI arguments before builder creation. Secret-shaped and
  unapproved configuration keys fail with value-safe diagnostics; operational
  commands remain outside configuration.
- OpenAPI synthetic values use the reserved provider position.
- Repository policy rejects canonical provider registration outside the one
  composition module and verifies the source order before typed resolution.

## Automated verification

| Verification                                  | Result                                                      |
| --------------------------------------------- | ----------------------------------------------------------- |
| GP-32 focused precedence and CLI tests        | PASS — 12 tests                                             |
| Backend unit tests                            | PASS — 86 tests                                             |
| Release backend build without restore         | PASS — zero warnings and zero errors                        |
| Backend compiler/analyzer policy and fixtures | PASS                                                        |
| Backend formatting policy and fixtures        | PASS                                                        |
| Backend architecture metadata/fixtures/tests  | PASS — 20 architecture tests                                |
| Backend test classification                   | PASS                                                        |
| Configuration architecture policy/fixtures    | PASS — 158 production files; 6 controlled failures rejected |
| Template configuration and ownership fixtures | PASS — 13 controlled failures rejected                      |
| Full repository validation and secret safety  | PASS                                                        |
| Infrastructure-independent OpenAPI generation | PASS                                                        |
| Frontend environment fixture regression       | PASS — 13 tests                                             |

No PostgreSQL, Redis, Docker, external vault, or external network service was
required for provider composition, compilation, unit/architecture tests, or
OpenAPI generation. All override and secret-provider tests used synthetic values
and isolated environment-variable prefixes.

## Qualification decision

Normal startup intentionally has no secret-provider instance. The callback is an
architectural insertion point, not a dummy provider. A future deployment-owned
provider can be added after environment variables and before CLI without changing
typed options or application/infrastructure consumers.
