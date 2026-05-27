import type {
  TelemetryCorrelationRecord,
  ConstitutionalTelemetryEvidence,
  TelemetryForensicExport,
  TelemetryLineageLedger,
  ConstitutionalTimelineRecord,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function exportTelemetryForensics(input: {
  telemetryId: string;
  evidence: ConstitutionalTelemetryEvidence;
  lineage: TelemetryLineageLedger;
  correlation: TelemetryCorrelationRecord;
  timeline: ConstitutionalTimelineRecord;
}): TelemetryForensicExport {
  return Object.freeze({
    exportId: hashConstitutionalTelemetryValue("constitutional-telemetry-export-id", input.telemetryId),
    telemetryId: input.telemetryId,
    evidenceHash: input.evidence.evidenceHash,
    lineageHash: input.lineage.lineageHash,
    correlationHash: input.correlation.correlationHash,
    timelineHash: input.timeline.timelineHash,
    exportHash: hashConstitutionalTelemetryValue("constitutional-telemetry-export", input),
  });
}
