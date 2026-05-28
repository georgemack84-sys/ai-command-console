import type { EvidenceNavigatorView, TraceViewerWarning } from "@/types/step-trace-viewer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import { hashTraceViewerValue } from "./traceViewHasher";

export function projectEvidenceNavigator(input: {
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
}): { projection: EvidenceNavigatorView; warnings: readonly TraceViewerWarning[] } {
  const items = input.validation.events.map((event) => {
    const sourceHash = event.lineageHashes.replayHash
      ?? event.lineageHashes.governanceHash
      ?? event.lineageHashes.registryHash
      ?? event.lineageHashes.provenanceHash
      ?? event.lineageHashes.survivabilityHash
      ?? event.lineageHashes.forensicHash;
    return Object.freeze({
      eventId: event.eventId,
      evidenceHash: event.payloadHash,
      evidenceType: event.validator ? `${event.validator}-event` : "validation-event",
      sourceHash,
      validationEventId: event.eventId,
      treatyReference: input.treaty.manifest.treatyId,
      missing: !sourceHash,
    });
  });

  const warnings: TraceViewerWarning[] = items
    .filter((item) => item.missing)
    .map((item) => ({
      code: "trace-evidence-missing" as const,
      message: "missing evidence remains visible",
      path: item.eventId,
    }));

  const projection: EvidenceNavigatorView = Object.freeze({
    items: Object.freeze(items),
    missingEvidenceCount: items.filter((item) => item.missing).length,
    projectionHash: hashTraceViewerValue("trace-evidence-navigator", items),
  });

  return { projection, warnings: Object.freeze(warnings) };
}
