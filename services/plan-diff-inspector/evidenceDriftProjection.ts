import type { EvidenceDriftView } from "@/types/plan-diff-inspector";
import { collectNamedArrayValues, collectNamedStringValues, isHashString, isPlainObject } from "./inspectionHasher";

function collectEvidenceRefs(value: unknown): readonly string[] {
  const refs = new Set<string>();
  const namedArrays = collectNamedArrayValues(value, (_path, key) => /evidenceRefs/i.test(key));
  for (const entry of namedArrays) {
    for (const item of entry.values) {
      if (typeof item === "string") {
        refs.add(item);
      }
    }
  }

  const namedStrings = collectNamedStringValues(
    value,
    (path, key) => /evidence/i.test(key) && /hash|ref/i.test(path),
  );
  for (const item of namedStrings) {
    refs.add(item.value);
  }

  if (isPlainObject(value) && isPlainObject((value as Record<string, unknown>).traceViewSummary)) {
    const traceViewSummary = (value as Record<string, unknown>).traceViewSummary as Record<string, unknown>;
    if (isPlainObject(traceViewSummary.evidenceView) && Array.isArray((traceViewSummary.evidenceView as Record<string, unknown>).items)) {
      for (const item of (traceViewSummary.evidenceView as Record<string, unknown>).items as unknown[]) {
        if (isPlainObject(item)) {
          if (typeof item.evidenceHash === "string") {
            refs.add(item.evidenceHash);
          }
          if (typeof item.sourceHash === "string") {
            refs.add(item.sourceHash);
          }
        }
      }
    }
  }

  return Object.freeze([...refs].sort((left, right) => left.localeCompare(right)));
}

export function projectEvidenceDrift(input: {
  baseArtifact: unknown;
  targetArtifact: unknown;
}): EvidenceDriftView {
  const baseRefs = collectEvidenceRefs(input.baseArtifact);
  const targetRefs = collectEvidenceRefs(input.targetArtifact);
  const addedEvidenceRefs = targetRefs.filter((ref) => !baseRefs.includes(ref));
  const missingEvidenceRefs = baseRefs.filter((ref) => !targetRefs.includes(ref));
  const changedEvidenceRefs = targetRefs.filter((ref) => baseRefs.includes(ref) === false && /changed/i.test(ref));
  const unverifiableEvidenceRefs = targetRefs.filter((ref) => !isHashString(ref) && !/^missing:/i.test(ref));
  const unknownDrift = baseRefs.length === 0 && targetRefs.length === 0;

  return Object.freeze({
    driftClass: unknownDrift
      ? "UNKNOWN_DRIFT"
      : addedEvidenceRefs.length > 0 || missingEvidenceRefs.length > 0 || changedEvidenceRefs.length > 0 || unverifiableEvidenceRefs.length > 0
        ? "EVIDENCE_DRIFT"
        : "NO_DRIFT",
    missingEvidenceRefs: Object.freeze(missingEvidenceRefs),
    addedEvidenceRefs: Object.freeze(addedEvidenceRefs),
    changedEvidenceRefs: Object.freeze(changedEvidenceRefs),
    unverifiableEvidenceRefs: Object.freeze(unverifiableEvidenceRefs),
    visibleEvidenceCount: targetRefs.length,
  });
}
