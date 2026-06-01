# Advisory Evidence Lifecycle Map

Status: documented after completion bundle final seal

## End-to-End Flow

```text
advisory adapters
unified advisory aggregation
advisory read model and dashboard
snapshot export
snapshot verification
offline review
archive index
archive UI
archive summary
summary UI
lifecycle rollup
retention policy and UI
lifecycle export bundle
lifecycle bundle verification
lifecycle bundle review UI
lifecycle bundle final seal
certification gate
certification review UI
certification final seal
completion report
completion review UI
completion review final seal
completion export bundle
completion bundle verification
completion bundle review UI
completion bundle final seal
```

## Advisory Source Chain

```text
release certification DH adapter
operational rules advisory adapter
deployment overrun advisory adapter
unified advisory aggregation
```

Source outputs remain read-only or advisory-only. Aggregation ranks risk and exposes conflicts, but it does not create enforcement.

## Snapshot Chain

```text
advisory read model
snapshot export
snapshot verification
offline review
review UI
```

Snapshots are exportable and verifiable. Review uses verification and review objects, not live advisory state.

## Archive Chain

```text
offline review
archive index
archive UI
archive summary
summary UI
```

Archive objects are reference-only. Archive UI does not mutate archive entries and does not import archived evidence into live state.

## Retention Chain

```text
archive summary
retention policy
retention policy UI
```

Retention classification is informational. Retention UI must not delete, compact, trust, or import evidence.

## Lifecycle Bundle Chain

```text
lifecycle rollup
lifecycle export bundle
lifecycle bundle verification
lifecycle bundle review UI
lifecycle bundle final seal
```

Bundle review UI consumes verification results only. Export artifacts are not directly inspected by the UI.

## Certification Chain

```text
lifecycle bundle final seal
certification gate
certification review UI
certification final seal
```

Certification validates the sealed lifecycle chain. Certification review is display-only and cannot mark evidence trusted.

## Completion Chain

```text
completion report
completion review UI
completion review final seal
completion export bundle
completion bundle verification
completion bundle review UI
completion bundle final seal
```

Completion confirms the advisory evidence lifecycle is complete, portable, and visible. Completion bundle verification proves exported completion bundles without live advisory state.
