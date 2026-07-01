# Phase 8M.39 Build Validation

Date: 2026-07-01

Status: PASS after repair

## Initial Build Result

Command:

```bash
npm run build
```

Initial result: FAIL

Failure stage:

- Next.js production build completed compilation, TypeScript, page data collection, and static page generation.
- Failure occurred during final build trace collection.

Failure reason:

- JavaScript heap out of memory.
- Earlier certification notes expected possible `EMFILE`; the reproduced failure was memory exhaustion during trace finalization.

## Repair

Build wrapper:

- `scripts/run-next.cjs` now applies `--max-old-space-size=8192` for production build commands.

Next config:

- Removed broad `outputFileTracingIncludes` for `node_modules/next/dist/**/*`.
- The broad include caused excessive trace graph pressure during standalone finalization.
- Next standalone tracing now relies on its default runtime dependency tracing plus existing explicit excludes.

## EMFILE Follow-Up

After the trace-memory repair, a later build reproduced the originally expected Windows file-handle failure:

```text
Error: EMFILE: too many open files, open '.next/export-detail.json'
```

Follow-up finding:

- The EMFILE failure persisted even when Webpack static generation was reduced to one worker.
- The same production build passed when using the default Next build path instead of forcing `--webpack`.

Final repair:

- Removed forced `--webpack` from `npm run build`.
- Limited Next build CPU count to 1.
- Disabled build worker threads.
- Limited static generation concurrency to 1.
- Increased minimum pages per static generation worker to 50.
- Kept server and build-trace parallelism disabled.
- Enabled Webpack memory optimizations.

## Latest Build Result

Command:

```bash
npm run build
```

Result: PASS

Evidence:

- Previous post-trace-memory build passed.
- Forced Webpack build failed with `EMFILE`.
- Default Next build passed with exit code 0.

Certification impact: production build blocker is resolved. Full certification remains blocked by incomplete release validation.
