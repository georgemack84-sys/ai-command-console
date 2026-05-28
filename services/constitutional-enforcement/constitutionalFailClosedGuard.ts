import { hashConstitutionalValue } from "./constitutionalHashLinker";
import type {
  ConstitutionalEnforcementError,
  ConstitutionalEnforcementFreezeRecord,
  ConstitutionalVerdict,
} from "./types/constitutionalEnforcementTypes";

export function buildConstitutionalFreezeRecord(input: {
  verdict: ConstitutionalVerdict;
  errors: readonly ConstitutionalEnforcementError[];
}): ConstitutionalEnforcementFreezeRecord {
  const reasons = [
    ...new Set(input.errors.map((error) => error.code)),
  ] as readonly ConstitutionalEnforcementError["code"][];
  const failedClosed = input.verdict.status !== "APPROVED" || reasons.length > 0;
  const frozen = failedClosed && input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_ENFORCEMENT_REPLAY_INVALID"
    || error.code === "CONSTITUTIONAL_ENFORCEMENT_GOVERNANCE_MISMATCH"
    || error.code === "CONSTITUTIONAL_ENFORCEMENT_NON_DETERMINISTIC"
    || error.code === "CONSTITUTIONAL_ENFORCEMENT_LEDGER_INVALID",
  );

  return Object.freeze({
    frozen,
    failedClosed,
    reasons,
    freezeHash: hashConstitutionalValue("constitutional-enforcement-freeze", {
      status: input.verdict.status,
      reasons,
    }),
  });
}
