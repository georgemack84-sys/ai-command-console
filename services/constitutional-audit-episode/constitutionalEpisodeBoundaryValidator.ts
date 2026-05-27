import type {
  ConstitutionalAuditEpisodeInput,
  ConstitutionalAuditError,
} from "@/types/constitutional-audit-episode";

export function validateConstitutionalEpisodeBoundary(
  input: ConstitutionalAuditEpisodeInput,
): readonly ConstitutionalAuditError[] {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const errors: ConstitutionalAuditError[] = [];
  if (normalized.includes("hiddenorchestration") || normalized.includes("recursiveworkflowemergence")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_HIDDEN_ORCHESTRATION",
      message: "Hidden orchestration or recursive workflow markers violate constitutional audit boundaries.",
      path: "metadata",
    }));
  }
  if (normalized.includes("syntheticauthorityinjection") || normalized.includes("approvalinjection")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_SYNTHETIC_AUTHORITY",
      message: "Synthetic authority or approval injection is forbidden.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
