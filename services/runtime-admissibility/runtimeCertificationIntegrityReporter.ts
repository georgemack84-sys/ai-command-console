import type {
  RuntimeAdmissibilityClassification,
  RuntimeAdmissibilityError,
  RuntimeCertificationIntegrityReport,
} from "./runtimeAdmissibilityStateTypes";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

export function buildRuntimeCertificationIntegrityReport(input: {
  admissibilityId: string;
  classification: RuntimeAdmissibilityClassification;
  errors: readonly RuntimeAdmissibilityError[];
  deterministic: boolean;
}): RuntimeCertificationIntegrityReport {
  const reasons = Object.freeze(input.errors.map((error) => error.code).sort());
  return Object.freeze({
    reportId: hashRuntimeCertificationValue("runtime-admissibility-report-id", input.admissibilityId),
    admissibilityId: input.admissibilityId,
    classification: input.classification,
    failClosed: input.classification !== "admissible",
    deterministic: input.deterministic,
    reasons,
    reportHash: hashRuntimeCertificationValue("runtime-admissibility-report", {
      admissibilityId: input.admissibilityId,
      classification: input.classification,
      reasons,
      deterministic: input.deterministic,
    }),
  });
}
