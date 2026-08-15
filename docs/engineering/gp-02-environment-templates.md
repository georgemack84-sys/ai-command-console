# GP-02 Environment Templates

**Status:** Implemented

## Outcome

GP-02 defines the version-controlled Proprium environment inventory without introducing configuration precedence, secret-provider integration, or new startup behavior. It qualifies existing templates against real consumers and makes the physical source location the canonical owner.

## Review findings resolved

- The actual API is `services/api`; a template under the otherwise empty `services/platform-api` directory created reversed canonical ownership and was removed.
- `APP_NAME`, `APP_ENVIRONMENT`, and `APP_VERSION` were passed to the API but never consumed. They were removed instead of preserved as phantom variables.
- `LOCAL_ADMIN_ENABLED`, `LOCAL_ADMIN_USERNAME`, and `LOCAL_ADMIN_PASSWORD` are real conditional API settings and were added to the backend contract.
- Platform metadata overrides now use ASP.NET Core's hierarchical `PLATFORM__NAME` and `PLATFORM__VERSION` mapping instead of unused `APP_*` aliases.
- Root Compose variables now interpolate into the Compose model. The API and frontend templates remain application-owned.

## Transitional root boundary

The repository still contains the legacy command-console application at its root. Its established variables remain below an explicit marker in `.env.example` to avoid breaking that supported surface during GP-02. They are not claimed as Proprium configuration and are governed by the legacy schemas until migration. This exception replaces the roadmap's greenfield assumption with the repository's actual transitional architecture.

## Ownership decisions

- Root Proprium section: local Compose identity, PostgreSQL provisioning, and host ports.
- Frontend: the four browser-visible `NEXT_PUBLIC_*` build values consumed by the validated environment module.
- Backend: ASP.NET Core hosting overrides plus values consumed by API configuration bootstrap and typed options.
- PostgreSQL database, user, and password occur in the root and API templates intentionally: Compose provisions the resource while the API consumes the same local values.

No other duplicate Proprium ownership is permitted.

## Mechanical contract

`npm run validate:configuration` fails for missing or untracked templates, ignored examples, unclassified frontend/backend keys, missing known Proprium keys, malformed or duplicate entries, phantom variables, unreviewed duplicate ownership, unsafe sensitive examples, secret-like public frontend variables, tracked local environment files, or broken ignore behavior.

The validator checks names and example classifications without printing secret values.

## Build independence

Templates describe runtime and build inputs; they are not prerequisites for restore or compilation. Frontend builds receive their four public values through the process environment. Backend restore and build require no local environment file, Docker, PostgreSQL, Redis, or credential.

## Deferred to GP-03 and GP-04

- source precedence and override rules;
- automatic backend `.env` loading;
- full startup binding and malformed-value behavior;
- production secret stores, rotation, and delivery;
- CI secret provisioning or deployment configuration.

The complete variable classification and developer instructions are in the [configuration guide](../onboarding/configuration.md).
