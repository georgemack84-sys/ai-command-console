import type {
  HumanSupremacyError,
  SupremacyEnforcementState,
  SupremacyIntegrityReport,
} from "./supremacyStateTypes";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function buildSupremacyIntegrityReport(input: {
  supremacyId: string;
  enforcementState: SupremacyEnforcementState;
  errors: readonly HumanSupremacyError[];
  deterministic: boolean;
}): SupremacyIntegrityReport {
  const reasons = Object.freeze(input.errors.map((item) => item.code));
  return Object.freeze({
    reportId: hashSupremacyValue("human-supremacy-integrity-report-id", input.supremacyId),
    supremacyId: input.supremacyId,
    enforcementState: input.enforcementState,
    failClosed: input.enforcementState !== "ENFORCED",
    deterministic: input.deterministic,
    reasons,
    reportHash: hashSupremacyValue("human-supremacy-integrity-report", {
      supremacyId: input.supremacyId,
      enforcementState: input.enforcementState,
      deterministic: input.deterministic,
      reasons,
    }),
  });
}
