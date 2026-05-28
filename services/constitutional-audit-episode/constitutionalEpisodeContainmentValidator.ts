import type {
  ConstitutionalAuditEpisodeInput,
  ConstitutionalAuditError,
} from "@/types/constitutional-audit-episode";

export function validateConstitutionalEpisodeContainment(
  input: ConstitutionalAuditEpisodeInput,
): readonly ConstitutionalAuditError[] {
  const errors: ConstitutionalAuditError[] = [];
  if (input.futureAutonomyResult.record.failClosed) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_FAIL_CLOSED",
      message: "Inherited fail-closed state blocks constitutional audit continuation.",
      path: "futureAutonomyResult.record.failClosed",
    }));
  }
  return Object.freeze(errors);
}
