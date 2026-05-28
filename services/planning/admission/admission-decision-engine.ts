import type {
  AdmissionBuildInput,
  AdmissionDecision,
  AdmissionLineageValidation,
  AdmissionRuntimeReadiness,
  TrustZoneEnforcement,
} from "./admission-types";

export function decideAdmission(input: {
  buildInput: AdmissionBuildInput;
  lineage: AdmissionLineageValidation;
  runtime: AdmissionRuntimeReadiness;
  trustZone: TrustZoneEnforcement;
}): {
  decision: AdmissionDecision;
  reasons: readonly string[];
  blocks: readonly string[];
  warnings: readonly string[];
} {
  const reasons: string[] = [];
  const blocks: string[] = [];
  const warnings: string[] = [...input.runtime.warnings, ...input.trustZone.warnings];

  if (!input.lineage.ok) {
    blocks.push(...input.lineage.failures.map((failure) => failure.message));
    return { decision: "DENIED", reasons, blocks, warnings };
  }

  if (!input.buildInput.governanceMetadata.governanceSnapshotHash || !input.buildInput.governanceMetadata.approvalChainHash) {
    blocks.push("Admission requires governance snapshot and approval chain hashes.");
    return { decision: "DENIED", reasons, blocks, warnings };
  }

  if (!input.trustZone.allowed) {
    blocks.push(...input.trustZone.failures.map((failure) => failure.message));
    return { decision: "QUARANTINED", reasons, blocks, warnings };
  }

  if (input.runtime.requiresRevalidation) {
    reasons.push(...input.runtime.failures.map((failure) => failure.message));
    return { decision: "REVALIDATION_REQUIRED", reasons, blocks, warnings };
  }

  if (input.buildInput.governanceMetadata.conflicts && input.buildInput.governanceMetadata.conflicts.length > 0) {
    reasons.push(...input.buildInput.governanceMetadata.conflicts);
    return { decision: "ESCALATED", reasons, blocks, warnings };
  }

  if (input.buildInput.governanceMetadata.requiredSimulation && !input.buildInput.simulationReadiness?.ready) {
    reasons.push("Governance requires a ready simulation artifact before admission.");
    return { decision: "SIMULATION_REQUIRED", reasons, blocks, warnings };
  }

  if (!input.buildInput.governanceMetadata.approvalsSatisfied) {
    blocks.push("Required approvals have not been satisfied.");
    return { decision: "DENIED", reasons, blocks, warnings };
  }

  if (input.runtime.shouldPause) {
    reasons.push(...input.runtime.failures.map((failure) => failure.message));
    return { decision: "PAUSED", reasons, blocks, warnings };
  }

  if (input.trustZone.requiresRevalidation) {
    reasons.push("Trust zone elevation requires revalidation before admission.");
    return { decision: "REVALIDATION_REQUIRED", reasons, blocks, warnings };
  }

  reasons.push("All admission checks passed.");
  return { decision: "APPROVED", reasons, blocks, warnings };
}
