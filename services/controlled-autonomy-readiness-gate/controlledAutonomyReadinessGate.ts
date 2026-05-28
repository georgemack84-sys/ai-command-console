import type { ConstitutionalReadinessResult, ReadinessClassification } from "@/types/constitutional-readiness";
import { evaluateConstitutionalReadiness } from "./constitutionalReadinessEvaluator";
import { certifyReplayDeterminism } from "./replayDeterminismCertificationEngine";
import { certifyGovernanceImmutability } from "./governanceImmutabilityCertificationEngine";
import { certifyApprovalCoordination } from "./approvalCoordinationCertificationEngine";
import { certifyRecommendationIntegrity } from "./recommendationIntegrityCertificationEngine";
import { certifyEscalationDeterminism } from "./escalationDeterminismCertificationEngine";
import { certifyDriftResistance } from "./constitutionalDriftResistanceEngine";
import { certifyContainment } from "./containmentCertificationEngine";
import { eliminateHiddenExecution } from "./hiddenExecutionEliminationEngine";
import { eliminateAuthorityLeakage } from "./authorityLeakageEliminationEngine";
import { proveRecursiveCoordinationAbsence } from "./recursiveCoordinationProofEngine";
import { buildFinalReadinessDecision } from "./finalReadinessDecisionEngine";

export type ControlledAutonomyReadinessGateInput = Readonly<{
  gateId: string;
  constitutionalReadinessResult: ConstitutionalReadinessResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: ControlledAutonomyGateLineageLedger;
  existingReplayLedger?: readonly ControlledAutonomyGateLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ControlledAutonomyGateError = Readonly<{
  code: string;
  message: string;
  path: string;
}>;

export type ControlledAutonomyGateAuthorityContract = Readonly<{
  executionAuthority: false;
  orchestrationAuthority: false;
  schedulingAuthority: false;
  runtimeMutationAuthority: false;
  governanceMutationAuthority: false;
  authorityInheritance: false;
  approvalInheritance: false;
  privilegeEscalationAuthority: false;
  adaptiveAutonomyAuthority: false;
  workflowContinuation: false;
  readinessAuthorization: false;
  autonomyAuthorization: false;
  humanSupremacyOverrideRequired: true;
}>;

export type ControlledAutonomyDomainName =
  | "replay"
  | "governance"
  | "approval"
  | "recommendation"
  | "escalation"
  | "drift"
  | "containment"
  | "hidden_execution"
  | "authority_leakage"
  | "recursive_coordination";

export type ControlledAutonomyDomainCertification = Readonly<{
  domain: ControlledAutonomyDomainName;
  certified: boolean;
  classification: ReadinessClassification;
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type ControlledAutonomyGateEvidence = Readonly<{
  evidenceId: string;
  gateId: string;
  readinessEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type ControlledAutonomyGateLineageEntry = Readonly<{
  entryId: string;
  gateId: string;
  coordinationId: string;
  certificationState: ReadinessClassification;
  createdAt: string;
  deterministicHash: string;
}>;

export type ControlledAutonomyGateLineageLedger = Readonly<{
  entries: readonly ControlledAutonomyGateLineageEntry[];
  lineageHash: string;
}>;

export type ControlledAutonomyGateLineageGraph = Readonly<{
  graphId: string;
  nodes: readonly Readonly<{
    nodeId: string;
    gateId: string;
    classification: ReadinessClassification;
  }>[];
  edges: readonly Readonly<{
    from: string;
    to: string;
    deterministicHash: string;
  }>[];
  graphHash: string;
}>;

export type ControlledAutonomyGateLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type ControlledAutonomyGateRiskRecord = Readonly<{
  riskId: string;
  gateId: string;
  riskLevel: "low" | "moderate" | "high" | "critical";
  aggregateScore: number;
  deterministicHash: string;
}>;

export type ControlledAutonomyReadinessGateRecord = Readonly<{
  gateId: string;
  coordinationId: string;
  readinessId: string;
  telemetryId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  certificationState: ReadinessClassification;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ControlledAutonomyReadinessGateResult = Readonly<{
  record: ControlledAutonomyReadinessGateRecord;
  authorityContract: ControlledAutonomyGateAuthorityContract;
  constitutionalReadiness: ConstitutionalReadinessResult;
  domainCertifications: readonly ControlledAutonomyDomainCertification[];
  evidence: ControlledAutonomyGateEvidence;
  lineage: ControlledAutonomyGateLineageLedger;
  lineageGraph: ControlledAutonomyGateLineageGraph;
  replayLedger: readonly ControlledAutonomyGateLedgerEntry[];
  risk: ControlledAutonomyGateRiskRecord;
  warnings: readonly string[];
  errors: readonly ControlledAutonomyGateError[];
  deterministicHash: string;
  derivedOnly: true;
}>;

export function certifyControlledAutonomyReadinessGate(
  input: ControlledAutonomyReadinessGateInput,
): ControlledAutonomyReadinessGateResult {
  const readiness = evaluateConstitutionalReadiness(input);
  const domains = Object.freeze([
    certifyReplayDeterminism(input),
    certifyGovernanceImmutability(input),
    certifyApprovalCoordination(input),
    certifyRecommendationIntegrity(input),
    certifyEscalationDeterminism(input),
    certifyDriftResistance(input),
    certifyContainment(input),
    eliminateHiddenExecution(input),
    eliminateAuthorityLeakage(input),
    proveRecursiveCoordinationAbsence(input),
  ]);
  return buildFinalReadinessDecision({
    input,
    readiness,
    domains,
  });
}
