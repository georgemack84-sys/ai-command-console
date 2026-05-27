# Changelog

## 4.3E

- added immutable governance metadata to published registry entries
- added governance attribution, lineage, provenance, replay attribution, and evidence hashing
- bound governance attribution to runtime containment hashes and authority locks

## 4.3D

- added capability-derived execution enforcement, trust, sandbox, and boundary derivation
- added replay containment enforcement and runtime authority locks
- added deterministic drift detection for runtime authority envelopes

## 4.3C

- added immutable `runtimeCapabilities`, `capabilityMetadata`, and `capabilityHash`
- bound replay validation to both `registryHash` and `capabilityHash`
- added deterministic runtime capability guard and audit events
- added capability-lineage escalation detection for published versions

## 4.3B

- added immutable canonical tool identities (`toolId@version`)
- added deterministic `registryHash` binding
- added published status and lineage metadata
- added replay binding and version-lineage validation surfaces

## 4.3A

- created canonical tool registry baseline
- registered filesystem.write as a governed executable tool
- migrated existing registry-backed tools into canonical file authority
