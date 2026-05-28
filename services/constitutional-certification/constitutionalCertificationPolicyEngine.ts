import type {
  CertificationPolicyRecord,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function evaluateCertificationPolicy(input: {
  certificationInput: ConstitutionalCertificationInput;
  containmentStrength: number;
  autonomyCapabilityGrowth: number;
}): CertificationPolicyRecord {
  const containmentDominatesAutonomy = input.containmentStrength > input.autonomyCapabilityGrowth;
  return Object.freeze({
    containmentStrength: input.containmentStrength,
    autonomyCapabilityGrowth: input.autonomyCapabilityGrowth,
    containmentDominatesAutonomy,
    policyHash: hashCertificationValue("constitutional-certification-policy", {
      certificationId: input.certificationInput.certificationId,
      containmentStrength: input.containmentStrength,
      autonomyCapabilityGrowth: input.autonomyCapabilityGrowth,
      containmentDominatesAutonomy,
    }),
  });
}
