import type {
  ConstitutionalReadinessCertification,
  ConstitutionalReadinessError,
  ConstitutionalReadinessLevel,
  ReadinessValidation,
} from "@/types/constitutional-autonomy-readiness-gate";
import { createReadinessError } from "./readinessErrors";

const LEVELS: readonly ConstitutionalReadinessLevel[] = [
  "CR0_UNVERIFIED",
  "CR1_REPLAY_VALID",
  "CR2_GOVERNANCE_VALID",
  "CR3_APPROVAL_VALID",
  "CR4_OVERRIDE_VALID",
  "CR5_ESCALATION_VALID",
  "CR6_CONTAINMENT_VALID",
  "CR7_CONSTITUTIONALLY_READY",
];

export function validateReadinessTimestamp(timestamp: string, path: string): readonly ConstitutionalReadinessError[] {
  return Object.freeze(
    !timestamp || Number.isNaN(Date.parse(timestamp))
      ? [createReadinessError("AUTONOMY_RUNTIME_UNSAFE", "Readiness timestamps must be immutable and valid.", path)]
      : [],
  );
}

export function validateReadinessValidation(validation: ReadinessValidation): readonly ConstitutionalReadinessError[] {
  const errors: ConstitutionalReadinessError[] = [];
  if (!LEVELS.includes(validation.readinessLevel)) {
    errors.push(createReadinessError("AUTONOMY_GOVERNANCE_MISMATCH", "Unknown readiness level.", "validation.readinessLevel"));
  }
  errors.push(...validateReadinessTimestamp(validation.createdAt, "validation.createdAt"));
  return Object.freeze(errors);
}

export function validateReadinessCertification(
  certification: ConstitutionalReadinessCertification,
): readonly ConstitutionalReadinessError[] {
  const errors: ConstitutionalReadinessError[] = [];
  if (!LEVELS.includes(certification.readinessLevel)) {
    errors.push(createReadinessError("AUTONOMY_GOVERNANCE_MISMATCH", "Unknown certification readiness level.", "certification.readinessLevel"));
  }
  if (certification.derivedOnly !== true) {
    errors.push(createReadinessError("AUTONOMY_EXECUTION_LIMIT", "Readiness certification must remain declarative only.", "certification.derivedOnly"));
  }
  errors.push(...validateReadinessTimestamp(certification.createdAt, "certification.createdAt"));
  return Object.freeze(errors);
}
