# Advisory Evidence Verification Workflows

Status: documented after completion bundle final seal

## Verification Pattern

Each verification step follows the same pattern:

```text
consume preserved object
normalize deterministic material
recompute hash or ID
compare expected and actual values
classify valid, disputed, or failed
return read-only verification result
```

## Snapshot Verification

Snapshot verification checks exported advisory snapshots and preserves read-only posture. It must not import snapshot contents into live advisory state.

## Lifecycle Bundle Verification

Lifecycle bundle verification checks lifecycle export bundles. Bundle review UI consumes verification output only.

Required boundary:

```text
lifecycle export bundle -> lifecycle bundle verification -> lifecycle bundle review UI
```

## Completion Bundle Verification

Completion bundle verification checks completion export bundles. It recomputes `exportHash`, recomputes `exportId`, verifies policy version, verifies completion metadata, and confirms authority containment.

Required boundary:

```text
completion export bundle -> completion bundle verification -> completion bundle review UI
```

## Seal Verification

Final seal phases run regression tests, typecheck, lint, and build. Seal commits may be empty when they record verification-only closure.

## Regression Workflow

Typical lifecycle seal validation includes:

```bash
npx vitest run <targeted-test> --config vitest.config.mjs
npx tsc --noEmit --pretty false
npm run lint
npm run build
```

## Hash Rules

Hash material should include stable evidence fields and exclude:

- generated timestamps unless explicitly part of the contract
- runtime environment
- browser state
- absolute paths
- random IDs
- object insertion order

## Review UI Rules

Review UI layers display verification result objects. They must not call builders, verifiers, or hash utilities.
