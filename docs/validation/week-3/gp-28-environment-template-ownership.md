# GP-28 Environment Template Structure and Ownership Validation

## Scope

This record qualifies canonical template paths, developer-local counterparts,
ownership headers, Git ignore/tracking behavior, specialized environment-file
classification, migration decisions, and application build independence.

## Automated evidence

| Evidence                                         | Result                                            |
| ------------------------------------------------ | ------------------------------------------------- |
| Configuration template and secret-boundary check | PASS                                              |
| Controlled ownership failures                    | PASS: 6 rejected fixtures                         |
| GP-27 configuration architecture policy          | PASS: 157 production source files                 |
| GP-27 controlled architecture failures           | PASS: 5 rejected fixtures                         |
| Repository consistency                           | PASS: 7,148 tracked paths and 45 required files   |
| Repository validation fixtures                   | PASS                                              |
| Secret safety                                    | PASS                                              |
| Developer documentation contract                 | PASS: 10 authoritative documents                  |
| Backend Release build                            | PASS: 7 projects, 0 warnings, 0 errors            |
| Frontend production build                        | PASS: public validation, TypeScript, and 7 routes |
| Formatting, syntax, and diff checks              | PASS                                              |

The isolated worktree reused the repository's installed frontend dependencies
through a temporary junction. Next's supported `--webpack` builder avoids
Turbopack's refusal to follow that out-of-root worktree link; no tracked build
configuration or application behavior changed.

## Git evidence

```text
IGNORED .env
IGNORED apps/web/.env.local
IGNORED services/api/.env
TRACKABLE .env.example
TRACKABLE apps/web/.env.example
TRACKABLE services/api/.env.example
UNTRACKED canonical local counterparts
```

The validator also confirms that all canonical templates are tracked and that
the obsolete `services/platform-api/.env.example` alias is absent.

## Exit decision

GP-28 satisfies AC-28.1 through AC-28.10 using `services/api` as the polished
path for the real Platform API. GP-29 through GP-31 can evolve contents, typed
binding, and provider behavior without reopening template topology or ownership.
