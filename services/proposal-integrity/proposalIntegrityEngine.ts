import type {
  OperationalProposal,
} from "./operationalProposal";
import type {
  ProposalIntegrityError,
  ProposalIntegrityInput,
  ProposalIntegrityLineageEntry,
  ProposalIntegrityResult,
} from "./proposalIntegrityStateTypes";
import { validateProposalSchema } from "./proposalSchemaValidator";
import { validateProposalBoundaries } from "./proposalBoundaryValidator";
import { bindProposalGovernanceSnapshot } from "./proposalGovernanceSnapshotBinder";
import { validateProposalGovernanceBinding } from "./proposalGovernanceBindingValidator";
import { detectProposalGovernanceDrift } from "./proposalGovernanceDriftDetector";
import { bindProposalReplaySnapshot } from "./proposalReplaySnapshotBinder";
import { validateProposalReplayBinding } from "./proposalReplayBindingValidator";
import { validateHistoricalProposalReplay } from "./historicalProposalReplayValidator";
import { validateProposalReplayDeterminism } from "./proposalReplayDeterminismValidator";
import { validateProposalReplay } from "./proposalReplayValidator";
import { detectProposalReplayDrift } from "./proposalReplayDriftDetector";
import { resolveProposalApprovalDependencies } from "./proposalApprovalDependencyResolver";
import { validateProposalApprovalLineage } from "./proposalApprovalLineageValidator";
import { detectProposalApprovalDrift } from "./proposalApprovalDriftDetector";
import { validateProposalRecommendationLineage } from "./proposalRecommendationLineageValidator";
import { detectProposalLineageDrift } from "./proposalLineageDriftDetector";
import { buildProposalLineageSnapshot } from "./proposalLineageSnapshotEngine";
import { blockProposalExecution } from "./proposalExecutionBlocker";
import { validateProposalAuthorityFirewall } from "./proposalIntegrityAuthorityFirewall";
import { validateProposalContainmentBoundary } from "./proposalIntegrityContainmentBoundary";
import { validateProposalIntegrityEscalation } from "./proposalIntegrityEscalationController";
import { validateProposalFreeze } from "./proposalFreezeController";
import { validateProposalRevocation } from "./proposalRevocationController";
import { generateProposalIntegrityEvidence } from "./proposalIntegrityEvidenceGenerator";
import { hashProposalIntegrityValue } from "./proposalHashEngine";
import { hashProposalReplayValue } from "./proposalReplayHashEngine";
import { hashProposalAuditValue } from "./proposalAuditHashEngine";
import { validateProposalSeal } from "./proposalSealValidator";
import { validateProposalIsolationBoundary } from "./proposalIsolationBoundary";
import { detectProposalMutation } from "./proposalMutationDetector";
import { buildProposalSnapshot } from "./proposalSnapshotEngine";
import { sealProposal } from "./proposalSealingEngine";
import { buildProposalIntegrityLock } from "./proposalIntegrityLock";
import { appendProposalIntegrityLineage, appendProposalIntegrityLedger } from "./immutableProposalIntegrityLog";
import { validateProposalIntegrityAuditLedger } from "./proposalIntegrityAuditValidator";
import { exportProposalIntegrityForensics } from "./proposalIntegrityForensics";

function freezeErrors(items: readonly ProposalIntegrityError[]): readonly ProposalIntegrityError[] {
  return Object.freeze([...items]);
}

function resolveStatus(input: {
  errors: readonly ProposalIntegrityError[];
  metadata?: Readonly<Record<string, unknown>>;
}) {
  if (input.metadata?.proposalRevoked === true) {
    return "revoked" as const;
  }
  if (input.metadata?.proposalFrozen === true) {
    return "frozen" as const;
  }
  return input.errors.length > 0 ? "replay_failed" as const : "replay_verified" as const;
}

export function buildProposalIntegrity(
  input: ProposalIntegrityInput,
): ProposalIntegrityResult {
  const schemaErrors = validateProposalSchema(input);
  const boundaryErrors = validateProposalBoundaries(input);
  const governanceBinding = bindProposalGovernanceSnapshot(input);
  const governanceErrors = validateProposalGovernanceBinding(governanceBinding);
  const governanceDriftErrors = detectProposalGovernanceDrift({
    integrityInput: input,
    binding: governanceBinding,
  });
  const replayBinding = bindProposalReplaySnapshot(input);
  const replayBindingErrors = validateProposalReplayBinding(replayBinding);
  const historicalReplayErrors = validateHistoricalProposalReplay(input);
  const replayDeterminismErrors = validateProposalReplayDeterminism(replayBinding);
  const replayErrors = validateProposalReplay(input);
  const replayDriftErrors = detectProposalReplayDrift(input);
  const approvalBinding = resolveProposalApprovalDependencies(input);
  const approvalErrors = validateProposalApprovalLineage(approvalBinding);
  const approvalDriftErrors = detectProposalApprovalDrift({
    integrityInput: input,
    binding: approvalBinding,
  });
  const lineageValidation = validateProposalRecommendationLineage(input);
  const lineageDriftErrors = detectProposalLineageDrift({
    integrityInput: input,
    binding: lineageValidation.binding,
  });
  const executionErrors = blockProposalExecution(input);
  const authorityErrors = validateProposalAuthorityFirewall(input);
  const containmentErrors = validateProposalContainmentBoundary(input);
  const escalationErrors = validateProposalIntegrityEscalation(input);
  const proposalFreezeErrors = validateProposalFreeze(input);
  const revocationErrors = validateProposalRevocation(input);

  const preliminaryErrors = freezeErrors([
    ...schemaErrors,
    ...boundaryErrors,
    ...governanceErrors,
    ...governanceDriftErrors,
    ...replayBindingErrors,
    ...historicalReplayErrors,
    ...replayDeterminismErrors,
    ...replayErrors,
    ...replayDriftErrors,
    ...approvalErrors,
    ...approvalDriftErrors,
    ...lineageValidation.errors,
    ...lineageDriftErrors,
    ...executionErrors,
    ...authorityErrors,
    ...containmentErrors,
    ...escalationErrors,
    ...proposalFreezeErrors,
    ...revocationErrors,
  ]);

  const proposalBase = {
    proposalId: input.proposalId,
    proposalType: input.proposalType,
    createdAt: input.createdAt,
    governanceSnapshotId: governanceBinding.governanceSnapshotId,
    replaySnapshotId: replayBinding.replaySnapshotId,
    approvalDependencyIds: [...approvalBinding.approvalDependencyIds],
    confidenceScore: input.decisionIntentBoundaryResult.artifact.confidence.score,
    riskClassification: input.decisionIntentBoundaryResult.artifact.risk.level,
    scopeBoundaries: [...input.scopeBoundaries],
    recommendationLineageHash: lineageValidation.binding.recommendationLineageHash,
    proposalHash: "",
    replayHash: replayBinding.replayHash,
    auditHash: "",
    executionAuthorized: false as const,
    advisoryOnly: true as const,
    executable: false as const,
    orchestrationAllowed: false as const,
    runtimeMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    schedulerRegistrationAllowed: false as const,
    operatorReviewRequired: true as const,
  };
  const proposalHash = hashProposalIntegrityValue("proposal", {
    proposalId: input.proposalId,
    proposalType: input.proposalType,
    governanceSnapshotId: governanceBinding.governanceSnapshotId,
    replaySnapshotId: replayBinding.replaySnapshotId,
    approvalDependencyIds: approvalBinding.approvalDependencyIds,
    confidenceScore: input.decisionIntentBoundaryResult.artifact.confidence.score,
    riskClassification: input.decisionIntentBoundaryResult.artifact.risk.level,
    scopeBoundaries: input.scopeBoundaries,
    recommendationLineageHash: lineageValidation.binding.recommendationLineageHash,
    replayHash: replayBinding.replayHash,
    constitutionalFlags: {
      advisoryOnly: true,
      executable: false,
      executionAuthorized: false,
      orchestrationAllowed: false,
      runtimeMutationAllowed: false,
      authorityMutationAllowed: false,
      governanceMutationAllowed: false,
      schedulerRegistrationAllowed: false,
      operatorReviewRequired: true,
    },
  });
  const auditHash = hashProposalAuditValue("proposal-audit", {
    proposalId: input.proposalId,
    recommendationLineageHash: input.recommendationLineageResult.artifact.lineageHash,
    intentLineageHash: input.decisionIntentBoundaryResult.lineage.lineageHash,
    governanceHash: governanceBinding.governanceHash,
    approvalHash: approvalBinding.approvalHash,
  });
  const proposal: OperationalProposal = Object.freeze({
    ...proposalBase,
    proposalHash,
    auditHash,
  });

  const sealErrors = validateProposalSeal(proposal);
  const isolationErrors = validateProposalIsolationBoundary(proposal);
  const mutationErrors = detectProposalMutation({
    proposal,
    integrityInput: input,
  });

  const errors = freezeErrors([
    ...preliminaryErrors,
    ...sealErrors,
    ...isolationErrors,
    ...mutationErrors,
  ]);

  const evidence = generateProposalIntegrityEvidence({
    integrityInput: input,
    reasons: Object.freeze(errors.map((error) => error.code)),
  });
  const snapshot = buildProposalSnapshot(proposal);
  const status = resolveStatus({
    errors,
    metadata: input.metadata,
  });
  const sealedRecord = sealProposal({
    proposal,
    createdAt: input.createdAt,
    status,
  });
  const _lock = buildProposalIntegrityLock(sealedRecord);
  const lineageEntry: ProposalIntegrityLineageEntry = Object.freeze({
    entryId: hashProposalIntegrityValue("proposal-lineage-entry-id", {
      proposalId: input.proposalId,
      createdAt: input.createdAt,
    }),
    proposalId: input.proposalId,
    recommendationId: input.recommendationLineageResult.artifact.recommendationId,
    status,
    proposalHash: proposal.proposalHash,
    createdAt: input.createdAt,
    deterministicHash: hashProposalIntegrityValue("proposal-lineage-entry", {
      proposalId: input.proposalId,
      status,
      proposalHash: proposal.proposalHash,
    }),
  });
  const lineage = appendProposalIntegrityLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const auditLedger = appendProposalIntegrityLedger({
    existing: appendProposalIntegrityLedger({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "proposal.integrity.validated",
        proposalId: input.proposalId,
        proposalHash: proposal.proposalHash,
        replayHash: proposal.replayHash,
        auditHash: proposal.auditHash,
        status,
      }),
      scope: "proposal-integrity",
    }),
    payload: Object.freeze({
      event: errors.length > 0 ? "proposal.integrity.failed_closed" : "proposal.integrity.sealed",
      proposalId: input.proposalId,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
      sealHash: sealedRecord.sealHash,
    }),
    scope: "proposal-integrity-audit",
  });
  const auditErrors = validateProposalIntegrityAuditLedger(auditLedger);
  const finalErrors = freezeErrors([
    ...errors,
    ...auditErrors,
  ]);
  const forensicExport = exportProposalIntegrityForensics({
    proposalId: input.proposalId,
    proposalHash: proposal.proposalHash,
    replayHash: proposal.replayHash,
    auditHash: proposal.auditHash,
    lineageHash: lineage.lineageHash,
  });

  return Object.freeze({
    proposal,
    governanceBinding,
    replayBinding,
    approvalBinding,
    lineageBinding: lineageValidation.binding,
    snapshot,
    sealedRecord,
    evidence,
    lineage,
    auditLedger,
    forensicExport,
    status,
    warnings: Object.freeze(finalErrors.length > 0
      ? ["Proposal integrity failed closed and preserved operator review under uncertainty."]
      : ["Proposal sealed immutably while remaining permanently non-executable."]),
    errors: finalErrors,
    deterministicHash: hashProposalIntegrityValue("proposal-integrity-result", {
      proposalHash: proposal.proposalHash,
      replayHash: proposal.replayHash,
      auditHash: proposal.auditHash,
      lineageHash: lineage.lineageHash,
      status,
      errorCodes: finalErrors.map((error) => error.code),
      forensicsHash: forensicExport.exportHash,
    }),
    derivedOnly: true as const,
  });
}

export const buildProposalIntegrityEngine = buildProposalIntegrity;
