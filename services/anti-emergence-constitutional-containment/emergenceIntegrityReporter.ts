import type {
  AntiEmergenceError,
  EmergenceClassification,
  EmergenceIntegrityReport,
} from "./antiEmergenceStateTypes";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function buildEmergenceIntegrityReport(input: {
  containmentId: string;
  classification: EmergenceClassification;
  errors: readonly AntiEmergenceError[];
  deterministic: boolean;
}): EmergenceIntegrityReport {
  const reasons = Object.freeze(input.errors.map((item) => item.code));
  return Object.freeze({
    reportId: hashEmergenceValue("anti-emergence-report-id", input.containmentId),
    containmentId: input.containmentId,
    classification: input.classification,
    failClosed: input.classification !== "contained",
    deterministic: input.deterministic,
    reasons,
    reportHash: hashEmergenceValue("anti-emergence-report", {
      containmentId: input.containmentId,
      classification: input.classification,
      deterministic: input.deterministic,
      reasons,
    }),
  });
}
