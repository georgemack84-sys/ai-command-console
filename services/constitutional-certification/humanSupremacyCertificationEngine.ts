import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
  HumanSupremacyCertificationRecord,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function certifyHumanSupremacyForCertification(input: ConstitutionalCertificationInput): {
  record: HumanSupremacyCertificationRecord;
  errors: readonly ConstitutionalCertificationError[];
} {
  const preserved =
    input.constitutionalReadinessResult.humanSupremacyCertification.supremacyPreserved
    && input.humanSupremacyResult.record.enforcementState !== "INVALID"
    && input.humanSupremacyResult.record.enforcementState !== "DISPUTED";
  const killSwitchValid =
    input.humanSupremacyResult.killSwitch.scope === "global"
      ? input.humanSupremacyResult.killSwitch.active
      : true;
  const score = preserved && killSwitchValid ? 1 : 0.1;
  const errors: ConstitutionalCertificationError[] = [];
  if (!preserved) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_OVERRIDE_FAILURE",
      message: "Human supremacy certification failed.",
      path: "humanSupremacyResult",
    });
  }
  return Object.freeze({
    record: Object.freeze({
      supremacyId: input.constitutionalReadinessResult.record.supremacyId,
      preserved,
      killSwitchValid,
      score,
      deterministicHash: hashCertificationValue("constitutional-certification-human-supremacy", {
        supremacyId: input.constitutionalReadinessResult.record.supremacyId,
        preserved,
        killSwitchValid,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
