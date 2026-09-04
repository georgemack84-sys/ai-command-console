# GP-28 Environment Template Structure and Ownership

## Outcome

Proprium has four canonical, tracked environment templates and four developer-owned local counterparts:

| Template                    | Owner               | Local counterpart     |
| --------------------------- | ------------------- | --------------------- |
| `.env.example`              | Repository Platform | `.env`                |
| `apps/web/.env.example`     | Frontend            | `apps/web/.env.local` |
| `services/api/.env.example` | Platform API        | `services/api/.env`   |
| `apps/learning-agent/.env.example` | Learning Agent | `apps/learning-agent/.env.local` |

The source roadmap names `services/platform-api`, but the executable, solution, Dockerfile, configuration bootstrap, and established GP-27 boundary are under `services/api`. Creating a template in the nonexistent alias would create two backend authorities. GP-28 therefore adapts the greenfield path to the real component and mechanically rejects the obsolete alias.

## Ownership rules

Templates are repository-controlled configuration contracts and contain only reviewed examples. Local counterparts are developer-owned, ignored, and untracked; developer ownership permits machine-specific values but not undocumented keys. Production secrets are deployment-platform owned and never become committed template values.

Root owns shared repository orchestration. Frontend owns browser-public build inputs only. Platform API owns private backend runtime inputs. The same key may cross root/API templates only when orchestration provisions a value the API consumes and the relationship is documented. Narrow ownership is the default.

New templates require an owner, purpose, local counterpart, ignore rule, public/secret policy, documentation entry, and validator registration in the same change. Alternative names such as `.env.sample`, `.env.template`, or a phantom service path are competing contracts and fail validation.

## Migration inventory

| Existing path or pattern                               | Classification | Decision                                                                                                     |
| ------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------ |
| `.env.example`                                         | `KEEP`         | Canonical repository template; transitional legacy section remains explicitly bounded                        |
| `apps/web/.env.example`                                | `KEEP`         | Canonical frontend template                                                                                  |
| `services/api/.env.example`                            | `KEEP`         | Canonical Platform API template                                                                              |
| `apps/learning-agent/.env.example`                     | `KEEP`         | Canonical Noesis learning-agent template                                                                    |
| `services/platform-api/.env.example`                   | `REMOVE`       | Previously removed phantom alias; validator prevents reintroduction                                          |
| `apps/web/.env.docker`                                 | `KEEP`         | Reviewed, tracked frontend Docker harness profile; not a developer template                                  |
| `apps/web/.env.test`                                   | `KEEP`         | Reviewed, tracked deterministic test profile; not a developer template                                       |
| `.github/environment-templates/*.env.example`          | `KEEP`         | Deployment-platform examples for the transitional legacy deployment surface; not local application templates |
| `services/api/Proprium.Api/appsettings.json`           | `KEEP`         | API-owned non-secret framework defaults, not an environment-template alias                                   |
| Canonical local counterparts                           | `LOCAL_ONLY`   | Ignored, untracked, optional physical copies of the documented contracts                                     |
| `.env.sample`, `.env.template`, other ad hoc templates | `REMOVE`       | None tracked; validator rejects future ambiguous contracts                                                   |

No local configuration file is tracked. GP-28 neither reads nor overwrites a developer's local values.

## Enforcement

`npm run validate:configuration` now composes the existing key/consumer/secret checks with six controlled ownership failures. The actual repository check verifies required templates are tracked and trackable, local counterparts are ignored and untracked, ownership headers are present, and every tracked environment artifact is registered. `npm run validate:repository` includes the negative fixtures so CI cannot silently weaken the topology.

GP-29 through GP-31 may evolve template contents but inherit these paths and owners. GP-32 may change provider loading/precedence; until then, the API local counterpart is an inventory that must be explicitly supplied through an approved provider.
