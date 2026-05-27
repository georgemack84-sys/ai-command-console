import { hashFailurePayload } from "@/services/failure-orchestration";
import type { DeploymentAttestation, ProductionCertificationRecord } from "./productionTrustTypes";

export function createDeploymentAttestation(input: {
  productionTrustId: string;
  certification: ProductionCertificationRecord;
  approvalChainHash: string;
  trustBoundary: string;
  environmentId: string;
  deploymentConstraints: readonly string[];
  rollbackRequired: boolean;
}): DeploymentAttestation {
  const payload = {
    productionTrustId: input.productionTrustId,
    registryHash: input.certification.registryHash,
    certificationHash: input.certification.certificationHash,
    approvalChainHash: input.approvalChainHash,
    trustBoundary: input.trustBoundary,
    environmentId: input.environmentId,
    deploymentConstraints: [...input.deploymentConstraints].sort(),
    rollbackRequired: input.rollbackRequired,
  };

  return {
    ...payload,
    evidenceHash: hashFailurePayload("EVIDENCE_BUNDLE", payload),
  };
}
