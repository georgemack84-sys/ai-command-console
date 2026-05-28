import { hashFailurePayload } from "@/services/failure-orchestration";
import type { ProductionTrustEvidence } from "./productionTrustTypes";

export function buildComplianceEvidenceBundle(input: Omit<ProductionTrustEvidence, "evidenceHash">): ProductionTrustEvidence {
  return {
    ...input,
    evidenceHash: hashFailurePayload("EVIDENCE_BUNDLE", input),
  };
}
