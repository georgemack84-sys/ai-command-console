import {
  archiveExecutionTreaty,
  hashExecutionTreatyEvidence,
  hashExecutionTreatyManifest,
  hashExecutionTreatyValue,
} from "@/services/execution-treaty";
import { createValidationRequest, orchestrateValidation, type ValidationContext } from "@/services/validation-core";
import { buildStepTraceView } from "@/services/step-trace-viewer";
import { buildPolicyDecisionExplanation } from "@/services/policy-decision-explainer";
import { buildPlanDiffInspection } from "@/services/plan-diff-inspector";
import { buildReplayReconstruction } from "@/services/replay-reconstruction-engine";
import { buildConstitutionalSnapshot } from "@/services/deterministic-snapshot-engine";
import type {
  AdaptationEnvelopeSnapshot,
  AuthorizationSnapshot,
  AutonomyLevel,
  ConstitutionalSnapshotEnvelope,
  GovernanceDecisionRecord,
  RevocationSnapshot,
} from "@/types/deterministic-snapshot-engine";
import type { MissionConsoleBuildInput } from "@/types/mission-intelligence-console";
import type { ExecutionTreatyEvidence, ExecutionTreatyPackage } from "@/types/execution-treaty";

function buildSeedTreaty(executionId: string): ExecutionTreatyPackage {
  const manifest = Object.freeze({
    handoffId: `handoff:${executionId}`,
    treatyId: `treaty:${executionId}`,
    planId: executionId,
    planHash: hashExecutionTreatyValue("seed-plan-hash", { executionId }),
    executionTruthHash: hashExecutionTreatyValue("seed-execution-truth", { executionId }),
    executionCompatibilityHash: hashExecutionTreatyValue("seed-compatibility", { executionId }),
    replaySnapshotHash: hashExecutionTreatyValue("seed-replay-snapshot", { executionId }),
    replayBindingHash: hashExecutionTreatyValue("seed-replay-binding", { executionId }),
    derivedSimulationHash: hashExecutionTreatyValue("seed-simulation", { executionId }),
    derivedAdmissionHash: hashExecutionTreatyValue("seed-admission", { executionId }),
    registrySnapshotHash: hashExecutionTreatyValue("seed-registry", { executionId }),
    governanceSnapshotHash: hashExecutionTreatyValue("seed-governance", { executionId }),
    approvalChainHash: hashExecutionTreatyValue("seed-approval-chain", { executionId }),
    provenanceHash: hashExecutionTreatyValue("seed-provenance", { executionId }),
    signatureHash: hashExecutionTreatyValue("seed-signature", { executionId }),
    survivabilityHash: hashExecutionTreatyValue("seed-survivability", { executionId }),
    forensicReplayHash: hashExecutionTreatyValue("seed-forensic-replay", { executionId }),
    governanceInheritanceHash: hashExecutionTreatyValue("seed-governance-inheritance", { executionId }),
    trustZone: "controlled" as const,
    handoffStatus: "ready" as const,
    preExecutionRevocationStatus: "still_admissible" as const,
    executorConstraints: Object.freeze({
      mayExecute: false as const,
      requiresRevalidation: true as const,
      allowedExecutorModes: Object.freeze(["future-controlled-executor"] as const),
      forbiddenActions: Object.freeze([
        "mutate-plan",
        "infer-missing-fields",
        "upgrade-risk",
        "bypass-approval",
        "replace-registry-snapshot",
        "replace-governance-snapshot",
        "replace-replay-binding",
        "ignore-quarantine",
        "ignore-revalidation",
        "infer-tool-contracts",
        "execute-without-boundary-validation",
      ] as const),
    }),
    executionStarted: false as const,
    dispatchPerformed: false as const,
    createdAt: "2026-05-16T15:00:00.000Z",
    createdBy: "mission-intelligence-console",
  });

  const productionCertification = Object.freeze({
    certificationId: `cert:${executionId}`,
    registryHash: manifest.registrySnapshotHash,
    governanceHash: manifest.governanceSnapshotHash,
    replayHash: manifest.replayBindingHash,
    integrityHash: hashExecutionTreatyValue("seed-integrity", { executionId }),
    adversarialCertificationHash: hashExecutionTreatyValue("seed-adversarial", { executionId }),
    issuedAt: "2026-05-16T14:45:00.000Z",
    expiresAt: "2026-05-17T14:45:00.000Z",
    certifiedBy: "governance-authority-01",
    certificationStatus: "certified" as const,
    certificationHash: hashExecutionTreatyValue("seed-certification-hash", { executionId }),
  });

  const productionEvidence = Object.freeze({
    productionTrustId: `trust:${executionId}`,
    certificationId: productionCertification.certificationId,
    registryHash: productionCertification.registryHash,
    certificationHash: productionCertification.certificationHash,
    replayValidation: Object.freeze({ valid: true, hash: manifest.replayBindingHash }),
    governanceValidation: Object.freeze({ valid: true, hash: manifest.governanceSnapshotHash }),
    integrityValidation: Object.freeze({ valid: true, hash: productionCertification.integrityHash }),
    adversarialValidation: Object.freeze({ valid: true, hash: productionCertification.adversarialCertificationHash }),
    survivabilityValidation: Object.freeze({ valid: true, hash: manifest.survivabilityHash }),
    revocationStatus: "certified" as const,
    forensicTimelineHash: hashExecutionTreatyValue("seed-forensic-timeline", { executionId }),
    generatedAt: "2026-05-16T14:50:00.000Z",
    evidenceHash: hashExecutionTreatyValue("seed-production-evidence", { executionId }),
  });

  const operationalTrustLedger = Object.freeze([
    Object.freeze({
      eventType: "certification.created" as const,
      productionTrustId: productionEvidence.productionTrustId,
      certificationId: productionCertification.certificationId,
      result: "success" as const,
      eventHash: hashExecutionTreatyValue("seed-ledger-event", { executionId, kind: "created" }),
      occurredAt: "2026-05-16T14:50:30.000Z",
    }),
  ]);

  const evidence: ExecutionTreatyEvidence = Object.freeze({
    productionCertification,
    productionEvidence,
    operationalTrustLedger,
    provenance: Object.freeze({
      provenanceHash: manifest.provenanceHash,
      signatureHash: manifest.signatureHash,
      approvalChainHash: manifest.approvalChainHash,
      governanceInheritanceHash: manifest.governanceInheritanceHash,
    }),
    survivability: Object.freeze({
      survivabilityHash: manifest.survivabilityHash,
      failureSnapshotHash: hashExecutionTreatyValue("seed-failure-snapshot", { executionId }),
      runtimeMode: "observed-non-executing",
      trustState: "certified",
    }),
    forensic: Object.freeze({
      forensicReplayHash: manifest.forensicReplayHash,
      forensicTimelineHash: productionEvidence.forensicTimelineHash,
      adversarialCertificationHash: productionCertification.adversarialCertificationHash,
    }),
    registryLineageHash: hashExecutionTreatyValue("seed-registry-lineage", { executionId }),
    governanceLineageHash: hashExecutionTreatyValue("seed-governance-lineage", { executionId }),
    replayLineageHash: hashExecutionTreatyValue("seed-replay-lineage", { executionId }),
  });

  const ledger = Object.freeze([
    Object.freeze({
      eventType: "treaty.created" as const,
      treatyId: manifest.treatyId,
      result: "success" as const,
      eventHash: hashExecutionTreatyValue("seed-treaty-ledger", { executionId }),
      occurredAt: "2026-05-16T15:00:30.000Z",
    }),
  ]);

  const manifestHash = hashExecutionTreatyManifest(manifest);
  const evidenceHash = hashExecutionTreatyEvidence(evidence);
  const treatyHash = hashExecutionTreatyValue("execution-treaty-package", {
    manifestHash,
    evidenceHash,
    ledgerHashes: ledger.map((entry) => entry.eventHash),
  });
  const archiveHash = archiveExecutionTreaty({
    manifest,
    evidence,
    ledger,
    hashes: { manifestHash, evidenceHash, treatyHash, archiveHash: "" },
  } as ExecutionTreatyPackage).archiveHash;

  return Object.freeze({
    manifest,
    evidence,
    ledger,
    hashes: Object.freeze({
      manifestHash,
      evidenceHash,
      treatyHash,
      archiveHash,
    }),
  });
}

function buildPlanDiffArtifacts(input: {
  treaty: ExecutionTreatyPackage;
  explanation: ReturnType<typeof buildPolicyDecisionExplanation>;
  traceView: ReturnType<typeof buildStepTraceView>;
}) {
  const baseArtifact = Object.freeze({
    planId: input.treaty.manifest.planId,
    planHash: input.treaty.manifest.planHash,
    riskTier: "medium",
    trustZone: input.treaty.manifest.trustZone,
    approvalRequirements: Object.freeze([...input.explanation.approvalExplanation.approvalsRequired]),
    rollbackContract: Object.freeze({
      survivabilityHash: input.treaty.manifest.survivabilityHash,
      revalidationRequired: false,
    }),
    policySnapshotHash: input.treaty.manifest.governanceSnapshotHash,
    capabilityClassification: Object.freeze(["read-only"]),
    sideEffectClassification: Object.freeze(["none"]),
    isolationRequirements: Object.freeze(["sandboxed"]),
    replaySnapshotHash: input.treaty.manifest.replaySnapshotHash,
    replayBindingHash: input.treaty.manifest.replayBindingHash,
    replayHash: input.treaty.evidence.replayLineageHash,
    registrySnapshotHash: input.treaty.manifest.registrySnapshotHash,
    executionTruthHash: input.treaty.manifest.executionTruthHash,
    provenanceHash: input.treaty.manifest.provenanceHash,
    evidenceRefs: Object.freeze([...input.explanation.evidenceRefs]),
    dependencies: Object.freeze([
      Object.freeze({ from: "step-1", to: "step-2" }),
    ]),
    steps: Object.freeze([
      Object.freeze({ stepId: "step-1", toolBinding: "tool:alpha", inputHash: "sha256:input-1", dependencies: Object.freeze([]) }),
      Object.freeze({ stepId: "step-2", toolBinding: "tool:beta", inputHash: "sha256:input-2", dependencies: Object.freeze(["step-1"]) }),
    ]),
    evidenceBundle: Object.freeze({
      registryLineageHash: input.treaty.evidence.registryLineageHash,
      governanceLineageHash: input.treaty.evidence.governanceLineageHash,
      replayLineageHash: input.treaty.evidence.replayLineageHash,
      policyExplanationHash: input.explanation.explanationHash,
    }),
  });

  const targetArtifact = Object.freeze({
    ...baseArtifact,
    riskTier: "high",
    trustZone: "quarantined",
    approvalRequirements: Object.freeze(["constitutional-review"]),
    replayHash: hashExecutionTreatyValue("seed-replay-drift", { planId: input.treaty.manifest.planId }),
    evidenceRefs: Object.freeze([...input.explanation.evidenceRefs, "missing:evidence"]),
    dependencies: Object.freeze([
      Object.freeze({ from: "step-2", to: "step-1" }),
      Object.freeze({ from: "step-1", to: "step-2" }),
    ]),
    steps: Object.freeze([
      Object.freeze({ stepId: "step-2", toolBinding: "tool:beta", inputHash: "sha256:input-2b", dependencies: Object.freeze(["step-1"]) }),
      Object.freeze({ stepId: "step-1", toolBinding: "tool:alpha", inputHash: "sha256:input-1", dependencies: Object.freeze([]) }),
    ]),
    evidenceBundle: Object.freeze({
      ...baseArtifact.evidenceBundle,
      replayLineageHash: hashExecutionTreatyValue("seed-replay-lineage-drift", { planId: input.treaty.manifest.planId }),
    }),
  });

  return { baseArtifact, targetArtifact };
}

export function buildMissionConsoleSeedContext(input?: Readonly<{
  missionId?: string;
  executionId?: string;
  autonomyLevel?: AutonomyLevel;
}>): MissionConsoleBuildInput {
  const executionId = input?.executionId ?? "mission-execution-001";
  const treaty = buildSeedTreaty(executionId);
  const request = createValidationRequest({
    targetType: "execution-treaty",
    submittedAt: "2026-05-16T15:01:00.000Z",
    treaty,
  });
  const validation = orchestrateValidation({
    request,
    treaty,
  } satisfies ValidationContext);
  const traceView = buildStepTraceView({
    treaty,
    validation,
    executionId,
    traceId: `trace:${executionId}`,
    includeGovernance: true,
    includeReplay: true,
    includeForensics: true,
    includeEvidence: true,
  });
  const policyExplanation = buildPolicyDecisionExplanation({
    decisionId: `decision:${executionId}`,
    executionId,
    traceView,
    validationOutput: validation,
    treatyEvidence: treaty,
    options: { strict: true },
  });
  const diffArtifacts = buildPlanDiffArtifacts({
    treaty,
    explanation: policyExplanation,
    traceView,
  });
  const diffInspection = buildPlanDiffInspection({
    comparisonMode: "PLAN_TO_PLAN",
    sourceRefs: Object.freeze(["treaty", "validation", "trace", "policy"]),
    baseArtifact: diffArtifacts.baseArtifact,
    targetArtifact: diffArtifacts.targetArtifact,
  });
  const replay = buildReplayReconstruction({
    treaty,
    validation,
    traceView,
    policyExplanation,
    comparisonArtifact: diffArtifacts.targetArtifact,
    requestedAt: "2026-05-16T15:02:00.000Z",
    environmentId: "mission-console",
  });

  const autonomyLevel = input?.autonomyLevel ?? "A2";
  const governanceDecision: GovernanceDecisionRecord = Object.freeze({
    decisionId: `governance:${executionId}`,
    decisionType: "approve",
    targetArtifactId: treaty.manifest.treatyId,
    participants: Object.freeze(["operator-01", "operator-02"]),
    quorumSatisfied: true,
    rationale: "bounded supervised preparation remains constitutionally permitted",
    timestamp: "2026-05-16T15:03:00.000Z",
  });
  const authorization: AuthorizationSnapshot = Object.freeze({
    authorizationId: `authorization:${executionId}`,
    autonomyLevel,
    executionConstraints: Object.freeze(["no-runtime-execution", "governed-only"]),
    supervisionRequirements: Object.freeze(["operator-visible", "approval-visible"]),
    revocationRules: Object.freeze(["policy-drift", "replay-drift", "manual-revoke"]),
    authorityHash: hashExecutionTreatyValue("seed-authorization-authority", { executionId }),
    replayHash: replay.reconstructionHash,
  });
  const revocation: RevocationSnapshot = Object.freeze({
    revocationId: `revocation:${executionId}`,
    targetArtifactId: authorization.authorizationId,
    revokedBy: Object.freeze(["operator-03"]),
    revocationReason: "manual review checkpoint",
    revocationTimestamp: "2026-05-16T15:04:00.000Z",
    supersededAuthorities: Object.freeze([authorization.authorizationId]),
    replayContinuityPreserved: true,
  });
  const adaptation: AdaptationEnvelopeSnapshot = Object.freeze({
    envelopeId: `adaptation:${executionId}`,
    allowedVariations: Object.freeze(["re-sequence-approved-step"]),
    prohibitedTransitions: Object.freeze(["expand-scope", "self-authorize"]),
    supervisionRequirements: Object.freeze(["governance-visible", "replay-bound"]),
    revocationTriggers: Object.freeze(["replay-drift", "governance-mismatch"]),
    replayHash: replay.reconstructionHash,
  });

  const snapshotTypes = [
    "execution",
    "policy",
    "registry",
    "approval",
    "memory",
    "validation",
    "governance_decision",
    "authorization",
    "revocation",
    "autonomy_classification",
    "adaptation",
  ] as const;

  const snapshots: ConstitutionalSnapshotEnvelope[] = snapshotTypes.map((snapshotType, index) => buildConstitutionalSnapshot({
    snapshotType,
    missionId: input?.missionId ?? "mission-001",
    executionId,
    lineageId: `lineage:${executionId}:${snapshotType}`,
    parentSnapshotId: index === 0 ? undefined : `snapshot-parent:${snapshotTypes[index - 1]}`,
    branchId: "primary",
    autonomyLevel,
    revocationEligible: true,
    supervisionRequirements: Object.freeze(["operator-visible", "replay-bound"]),
    createdAt: `2026-05-16T15:${(5 + index).toString().padStart(2, "0")}:00.000Z`,
    schemaVersion: "4.4F.constitutional-snapshot.v1",
    payload: Object.freeze({
      snapshotType,
      treatyHash: treaty.hashes.treatyHash,
      validationHash: validation.result.resultHash,
      replayHash: replay.reconstructionHash,
    }),
    sourceArtifacts: Object.freeze({
      treaty,
      validation,
      traceView,
      policyExplanation,
      diffInspection,
      replay,
      governanceDecision,
      authorization,
      revocation,
      adaptation,
      sourceRefs: Object.freeze([treaty.manifest.treatyId, validation.result.validationId, replay.replayId]),
    }),
  }));

  return Object.freeze({
    missionId: input?.missionId ?? "mission-001",
    executionId,
    generatedAt: "2026-05-16T15:20:00.000Z",
    treaty,
    validation,
    traceView,
    policyExplanation,
    diffInspection,
    replay,
    snapshots: Object.freeze(snapshots),
  });
}
