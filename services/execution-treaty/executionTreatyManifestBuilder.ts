import type { RegistrySnapshot } from "@/services/registry-snapshots";
import type { RegistryTrustAdmissionResult } from "@/services/registry-trust";
import type { FailureOrchestrationInput, FailureOrchestrationResult } from "@/services/failure-orchestration";
import type {
  ProductionCertificationRecord,
  ProductionReadinessResult,
  ProductionTrustEvidence,
  ProductionTrustLedgerEvent,
  SurvivabilityCertificationResult,
} from "@/services/production-trust-framework";
import type { TrustCertificationResult } from "@/services/enforcement-test-harness";
import { buildExecutorConstraints } from "./executionTreatyConstraintEngine";
import { appendExecutionTreatyEvent } from "./executionTreatyEvidenceLedger";
import { bindTreatyForensics } from "./executionTreatyForensicBinder";
import { bindGovernanceTreatyEvidence } from "./executionTreatyGovernanceBinder";
import { hashExecutionTreatyArchive, hashExecutionTreatyEvidence, hashExecutionTreatyManifest, hashExecutionTreatyValue } from "./executionTreatyHasher";
import { bindTreatyProvenance } from "./executionTreatyProvenanceBinder";
import { validateTreatyReplayBindings } from "./executionTreatyReplayValidator";
import { bindRegistryTreatyEvidence } from "./executionTreatyRegistryBinder";
import { bindTreatySurvivability } from "./executionTreatySurvivabilityBinder";
import type { ExecutionTreatyEvidence, ExecutionTreatyManifest, ExecutionTreatyPackage } from "@/types/execution-treaty";

export type ExecutionTreatyBuildInput = Readonly<{
  planId: string;
  planHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  replaySnapshotHash: string;
  replayBindingHash: string;
  derivedSimulationHash: string;
  derivedAdmissionHash: string;
  snapshot: RegistrySnapshot;
  trustedSnapshotAdmission: RegistryTrustAdmissionResult;
  readiness: ProductionReadinessResult;
  productionCertification: ProductionCertificationRecord;
  productionEvidence: ProductionTrustEvidence;
  operationalTrustLedger: readonly ProductionTrustLedgerEvent[];
  trustCertification: TrustCertificationResult;
  survivabilityCertification: SurvivabilityCertificationResult;
  failureInput: FailureOrchestrationInput;
  failureState: FailureOrchestrationResult;
  createdAt: string;
  createdBy: string;
  scenarioId?: string;
  currentRegistrySnapshotHash?: string;
  currentReplaySnapshotHash?: string;
  currentReplayBindingHash?: string;
  liveRegistryFallbackDetected?: boolean;
}>;

function deriveTrustZone(input: {
  readiness: ProductionReadinessResult;
  failureState: FailureOrchestrationResult;
}): ExecutionTreatyManifest["trustZone"] {
  if (input.readiness.status === "revoked" || input.failureState.runtimeMode === "FULL_CONTAINMENT") {
    return "quarantined";
  }
  if (input.readiness.status === "denied" || input.readiness.status === "requires_recertification") {
    return "restricted";
  }
  return "controlled";
}

function deriveStatuses(input: {
  readiness: ProductionReadinessResult;
  replayValid: boolean;
  governanceValid: boolean;
  registryValid: boolean;
}): Pick<ExecutionTreatyManifest, "handoffStatus" | "preExecutionRevocationStatus"> {
  if (input.readiness.status === "revoked") {
    return { handoffStatus: "revoked", preExecutionRevocationStatus: "revoked" };
  }
  if (input.readiness.status === "denied" && (!input.governanceValid || !input.registryValid)) {
    return { handoffStatus: "quarantined", preExecutionRevocationStatus: "quarantined" };
  }
  if (!input.replayValid || input.readiness.status === "requires_recertification") {
    return { handoffStatus: "revalidation-required", preExecutionRevocationStatus: "must_revalidate" };
  }
  return { handoffStatus: "ready", preExecutionRevocationStatus: "still_admissible" };
}

export function buildExecutionTreatyPackage(input: ExecutionTreatyBuildInput): ExecutionTreatyPackage {
  const replay = validateTreatyReplayBindings({
    readiness: input.readiness,
    replaySnapshotHash: input.replaySnapshotHash,
    replayBindingHash: input.replayBindingHash,
    liveRegistryFallbackDetected: input.liveRegistryFallbackDetected,
    currentReplaySnapshotHash: input.currentReplaySnapshotHash,
    currentReplayBindingHash: input.currentReplayBindingHash,
  });
  const registry = bindRegistryTreatyEvidence({
    snapshot: input.snapshot,
    currentRegistrySnapshotHash: input.currentRegistrySnapshotHash,
  });
  const provenance = bindTreatyProvenance({
    trustedSnapshotAdmission: input.trustedSnapshotAdmission,
  });
  const governance = bindGovernanceTreatyEvidence({
    governanceSnapshotHash: input.snapshot.manifest.governanceHash,
    approvalChainHash: provenance.approvalChainHash,
    provenanceHash: provenance.provenanceHash,
    governanceVerified: input.readiness.governanceVerified,
  });
  const survivability = bindTreatySurvivability({
    failureState: input.failureState,
    survivabilityCertification: input.survivabilityCertification,
  });
  const forensic = bindTreatyForensics({
    scenarioId: input.scenarioId ?? "treaty-handoff",
    failureInput: input.failureInput,
    failureResult: input.failureState,
    adversarialCertificationHash: input.trustCertification.resultHash,
  });

  const trustZone = deriveTrustZone({ readiness: input.readiness, failureState: input.failureState });
  const statuses = deriveStatuses({
    readiness: input.readiness,
    replayValid: replay.valid,
    governanceValid: governance.failures.length === 0,
    registryValid: registry.failures.length === 0,
  });

  const manifest: ExecutionTreatyManifest = {
    handoffId: hashExecutionTreatyValue("handoff-id", { planId: input.planId, createdAt: input.createdAt }),
    treatyId: hashExecutionTreatyValue("treaty-id", {
      planHash: input.planHash,
      registrySnapshotHash: registry.registrySnapshotHash,
      certificationHash: input.productionCertification.certificationHash,
    }),
    planId: input.planId,
    planHash: input.planHash,
    executionTruthHash: input.executionTruthHash,
    executionCompatibilityHash: input.executionCompatibilityHash,
    replaySnapshotHash: input.replaySnapshotHash,
    replayBindingHash: input.replayBindingHash,
    derivedSimulationHash: input.derivedSimulationHash,
    derivedAdmissionHash: input.derivedAdmissionHash,
    registrySnapshotHash: registry.registrySnapshotHash,
    governanceSnapshotHash: input.snapshot.manifest.governanceHash,
    approvalChainHash: provenance.approvalChainHash,
    provenanceHash: provenance.provenanceHash,
    signatureHash: provenance.signatureHash,
    survivabilityHash: survivability.survivabilityHash,
    forensicReplayHash: forensic.forensicReplayHash,
    governanceInheritanceHash: governance.governanceInheritanceHash,
    trustZone,
    handoffStatus: statuses.handoffStatus,
    preExecutionRevocationStatus: statuses.preExecutionRevocationStatus,
    executorConstraints: buildExecutorConstraints(),
    executionStarted: false,
    dispatchPerformed: false,
    createdAt: input.createdAt,
    createdBy: input.createdBy,
  };

  const evidence: ExecutionTreatyEvidence = {
    productionCertification: input.productionCertification,
    productionEvidence: input.productionEvidence,
    operationalTrustLedger: input.operationalTrustLedger,
    provenance: {
      provenanceHash: provenance.provenanceHash,
      signatureHash: provenance.signatureHash,
      approvalChainHash: provenance.approvalChainHash,
      governanceInheritanceHash: governance.governanceInheritanceHash,
    },
    survivability: {
      survivabilityHash: survivability.survivabilityHash,
      failureSnapshotHash: survivability.failureSnapshotHash,
      runtimeMode: survivability.runtimeMode,
      trustState: survivability.trustState,
    },
    forensic: {
      forensicReplayHash: forensic.forensicReplayHash,
      forensicTimelineHash: forensic.forensicTimelineHash,
      adversarialCertificationHash: forensic.adversarialCertificationHash,
    },
    registryLineageHash: registry.registryLineageHash,
    governanceLineageHash: input.snapshot.manifest.governanceHash,
    replayLineageHash: hashExecutionTreatyValue("replay-lineage", {
      replaySnapshotHash: input.replaySnapshotHash,
      replayBindingHash: input.replayBindingHash,
      replayValidated: replay.valid,
    }),
  };

  const manifestHash = hashExecutionTreatyManifest(manifest);
  const evidenceHash = hashExecutionTreatyEvidence(evidence);
  const treatyHash = hashExecutionTreatyValue("execution-treaty-package", {
    manifestHash,
    evidenceHash,
  });
  const archiveHash = hashExecutionTreatyArchive({
    treatyId: manifest.treatyId,
    treatyHash,
  });

  const ledger = appendExecutionTreatyEvent([], {
    eventType:
      statuses.handoffStatus === "ready"
        ? "treaty.created"
        : statuses.handoffStatus === "quarantined"
          ? "treaty.quarantined"
          : statuses.handoffStatus === "revoked"
            ? "treaty.revoked"
            : "treaty.revalidation-required",
    treatyId: manifest.treatyId,
    result: statuses.handoffStatus === "ready" ? "success" : "failure",
    errorCode:
      statuses.handoffStatus === "quarantined"
        ? "HANDOFF_QUARANTINED"
        : statuses.handoffStatus === "revoked"
          ? "HANDOFF_REVOKED"
          : statuses.handoffStatus === "revalidation-required"
            ? "HANDOFF_REVALIDATION_REQUIRED"
            : undefined,
    occurredAt: input.createdAt,
  });

  return {
    manifest,
    evidence,
    hashes: {
      manifestHash,
      evidenceHash,
      treatyHash,
      archiveHash,
    },
    ledger,
  };
}
