# GP-18 Baseline Freeze and Week 2 Admission

## Status and scope

GP-18 is a derived Week 1 closeout, not an additional canonical Day 5 feature.
It preserves the revision qualified by GP-17 and defines how later work may
change the engineering foundation without making the historical evidence
misleading. It does not add a second policy engine, a release process, or Week 2
application functionality.

The implementation is `FOUNDATION_COMPATIBLE`: it composes the existing
qualification, CI workflow, repository, documentation, command-parity, and
architecture controls. It changes no runtime, migration, OpenAPI, health, or CI
job behavior.

## Frozen historical baseline

The immutable Week 1 reference is:

- branch: `codex/day5-gp17-final-qualification`;
- commit: `d6a25c87423d69877965d7cb1541b726c7ad3b5d`;
- qualification: `DAY 5 QUALIFICATION: QUALIFIED`;
- evidence: [Day 5 qualification](../validation/day-5/qualification.md);
- authoritative CI run: `31771116358`, with all seven GP-15 gates successful.

"Frozen" identifies a historical source revision and its evidence. It does not
make repository files immutable. Later foundation changes must preserve the
contract or amend it explicitly, and must never rewrite GP-17 as if it certified
a later revision.

## Protected contracts

| Contract | Primary repository authority | Mechanical protection |
| --- | --- | --- |
| Configuration and secrets | `.env.example`, `apps/web/.env.example`, `services/api/.env.example`, configuration guide | configuration and secret validators |
| Repository standards | `.editorconfig`, `.gitattributes`, `.gitignore`, root lockfiles and SDK selectors | repository validator and fixtures |
| Frontend tooling | `apps/web/tsconfig.json`, ESLint, Prettier, dependency-cruiser configuration | frontend validation and fixtures |
| Backend tooling | `Directory.Build.props`, `Directory.Build.targets`, `Directory.Packages.props`, `global.json` | compiler, format, architecture, and classification validators |
| Commands and Windows parity | `scripts/proprium-command.cjs`, `scripts/proprium.ps1` | repository-command and PowerShell tests |
| CI | `.github/workflows/ci.yml` | workflow contract validator and GitHub required checks |
| Migrations | EF Core migrations and the `database-migrations` service | migration documentation and integration validation |
| OpenAPI | API generator and `validate openapi` command | OpenAPI validation gate |
| Health | API health endpoints and Compose health contracts | health validation gate and ADR-0005 |
| Documentation and evidence | `README.md`, `docs/onboarding`, `docs/operations`, `docs/validation/day-5` | documentation, Markdown, qualification, and baseline validators |

The complete transition record is [Week 2 admission](../validation/day-5/week-2-admission.md).

## Change classification

Every pull request that touches a protected contract must use one classification:

- `NON_FOUNDATION`: uses the existing foundation without changing it.
- `FOUNDATION_COMPATIBLE`: extends enforcement or documentation while preserving
  the external developer contract.
- `FOUNDATION_AMENDMENT`: intentionally changes a command, prerequisite,
  configuration rule, CI gate, architecture rule, supported platform, migration
  authority, OpenAPI authority, or health semantic.
- `FOUNDATION_BREAKING`: weakens or bypasses a guarantee without an approved
  replacement. The default disposition is block.

A foundation amendment must record the current and proposed contracts, reason,
affected files and commands, CI and documentation impact, compatibility or
migration path, required validation, and whether an ADR is required. Durable
architecture changes require a new or amended ADR; local implementation details
do not.

## Requalification

Use impact-based validation. Ordinary feature work runs normal CI. Targeted
requalification is required when a protected contract changes. Full Day 5
requalification should be performed when supported runtimes or operating systems,
canonical command architecture, required CI gate architecture, build or clean
machine prerequisites, migration authority, or required infrastructure setup
changes materially.

A material requalification produces a new evidence record. The GP-17 record
remains historical.

## Mechanical guard

Run either supported entry point:

```bash
npm run repo -- validate baseline
```

```powershell
.\scripts\proprium.ps1 validate baseline
```

The command composes GP-17 qualification evidence, the exact seven-job CI
contract, and the GP-18 admission/inventory contract. `validate repo` includes the
same baseline guard. Pull requests expose the classification and affected-contract
questions so intentional amendments remain visible during review.

## Admission rule

`QUALIFIED` admits Week 2. `CONDITIONALLY_QUALIFIED` admits only when the recorded
constraint does not block the planned work. `NOT_QUALIFIED` blocks
foundation-dependent work. The current result is:

`WEEK 2 ADMISSION: ADMITTED`

`GP-18 STATUS: COMPLETE — BASELINE FROZEN — WEEK 2 ADMITTED`
