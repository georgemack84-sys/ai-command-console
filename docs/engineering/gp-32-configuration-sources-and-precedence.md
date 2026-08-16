# GP-32 Configuration Sources and Precedence

**Status:** Implemented

## Outcome

Proprium now encodes one deterministic Platform API provider chain in
`ApiConfigurationSources.Configure`. Lower entries override higher entries:

```text
Safe application defaults
        ↓
appsettings.json
        ↓
optional appsettings.{Environment}.json
        ↓
process environment variables
        ↓
optional deployment secret provider
        ↓
allowlisted non-secret command line
        ↓
typed resolution and validation
```

ASP.NET Core's incidental default application providers are cleared before this
chain is added. Framework upgrades therefore cannot silently insert User Secrets,
reloadable files, or another application provider. Environment selection remains
framework host configuration through `ASPNETCORE_ENVIRONMENT` and is validated as
Development, Test, Staging, or Production by the typed resolver.

## Layer contract

| Layer                         | Owner and location                                | Permitted content                               | Secret policy                                                                |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Safe defaults                 | Application code and `appsettings.json`           | Metadata and genuinely defaultable behavior     | No credentials, private keys, certificates, or production connection strings |
| Environment-specific settings | Optional tracked `appsettings.{Environment}.json` | Environment-specific behavior such as logging   | No secrets; none are currently required                                      |
| Environment variables         | Runtime/deployment platform                       | Canonical runtime values using stable names     | May carry runtime secrets under GP-35 controls                               |
| Secret provider               | Deployment/security platform; reserved callback   | Authority-bearing values from a future provider | Overrides environment values without changing typed consumers                |
| Command line                  | Authorized operator/tooling                       | Narrow non-secret operational overrides         | Secret-shaped keys are rejected before builder creation                      |

The absence of a production secret provider adds no dummy source. The OpenAPI
export command supplies synthetic in-memory values through the reserved callback
and is classified `TEST_ONLY`; it occupies the correct position without becoming
a developer override mechanism.

## Provider inventory

- `appsettings.json`: **CANONICAL_DEFAULT**. It currently contains only public
  platform name/version defaults.
- `appsettings.{Environment}.json`: **CANONICAL_ENVIRONMENT_SPECIFIC**, optional,
  static, and behavior-only. No such files are currently needed.
- process environment: **CANONICAL_ENVIRONMENT_VARIABLE** and the primary local,
  Docker, CI, and deployment runtime mechanism.
- deployment callback: **CANONICAL_SECRET** insertion point; absent in normal
  startup and represented by an in-memory fake in tests/OpenAPI tooling.
- approved CLI source: **CANONICAL_CLI** for non-secret values only.
- OpenAPI in-memory values: **TEST_ONLY** in the reserved-provider position.
- ASP.NET Core Development User Secrets: **REMOVE / NOT LOADED**.
- backend `.env`: inventory/local convenience only; **NOT LOADED** by the API.
- root `.env`: Compose interpolation input; **NOT AN API PROVIDER**.

No other file, registry, home-directory, HTTP, or custom provider participates.
Provider registration outside the canonical configuration source module is
rejected by repository architecture policy.

## Command-line policy

Approved application/host configuration keys are:

- `urls`;
- `POSTGRES_PORT`;
- `REDIS_PORT`;
- `Logging:LogLevel:Default`.

The application commands `--health-probe`, `--export-permissions`,
`--write-openapi`, and `--migrate` are parsed by their owning command paths and
are not promoted into configuration. The ASP.NET host's `--environment`,
`--contentRoot`, and `--applicationName` bootstrap arguments are likewise
consumed by the host without becoming final application configuration. Any
other configuration key is rejected.
Names containing password, secret, token, private, signing, certificate,
credential, or connection-string terms are rejected with key-only diagnostics.
Command line is an exceptional operational surface, not the normal deployment
mechanism.

## Override and validation semantics

The final provider value is selected before typed parsing. Empty strings are
explicit values unless the owning model documents optional-empty semantics; they
do not mean "fall back." If a stronger layer supplies malformed data, startup
validation fails on that value. It never searches weaker providers for a usable
alternative.

Tests assert every override transition, the exact provider type order across
Development/Test/Production, secret and unknown CLI rejection, operational-command
separation, and invalid-stronger-value behavior without live infrastructure or
real secrets.

## Frontend, Docker, and CI

The web preserves its framework-specific build model: ignored `.env.local` fills
missing public values for validation, existing process values win, and
`NEXT_PUBLIC_*` values are fixed into each environment-specific build. No secret
provider or runtime mutation is introduced into browser configuration.

Compose interpolation uses, from weakest to strongest, YAML defaults, the root
`.env`, and the invoking process. Compose then supplies explicit container
environment variables. Host values such as `API_PORT` and `POSTGRES_HOST_PORT`
are orchestration inputs; container values such as `POSTGRES_HOST=postgres` are
API runtime inputs.

GitHub Actions supplies frontend build values and API integration values through
job environment variables/secrets. Unit, architecture, compile, and OpenAPI jobs
do not depend on runner-local files. Future production platforms must preserve
the same logical layers; adopting a vault changes only the reserved provider
registration, not business or infrastructure consumers.
