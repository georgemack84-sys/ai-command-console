import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { buildDependencyInvalidations } from "./dependencyInvalidationEngine";
import { appendRevocationLineage } from "./revocationLineageRegistry";
import { validateReplayRevocationContainment } from "./replayRevocationValidator";
import { appendRevocationAuditLedger, buildRevocationAuditEntry } from "./revocationAuditLog";
import { canonicalizeProposalRevocationToString } from "./proposalRevocationCanonicalizer";
import { validateProposalRevocationApprovals } from "./proposalRevocationApprovalValidator";
import { validateProposalRevocationDependencies } from "./proposalRevocationDependencyValidator";
import { validateProposalRevocationDeterminism } from "./proposalRevocationDeterminismValidator";
import { resolveProposalRevocationState } from "./proposalRevocationFailClosedGuard";
import { validateProposalRevocationGovernance } from "./proposalRevocationGovernanceValidator";
import { hashProposalRevocationValue } from "./proposalRevocationHasher";
import { propagateProposalRevocation } from "./proposalRevocationPropagationCoordinator";
import { validateProposalRevocationReplay } from "./proposalRevocationReplayValidator";
import { validateProposalRevocationState } from "./proposalRevocationStateGuard";
import type {
  ProposalRevocationError,
  ProposalRevocationInput,
  ProposalRevocationResult,
  ProposalRevocationStageRecord,
  RevocationAuditEntry,
} from "./proposalRevocationTypes";

function buildStages(errors: readonly ProposalRevocationError[]): readonly ProposalRevocationStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "request_validation",
    "governance_validation",
    "replay_validation",
    "dependency_validation",
    "approval_validation",
    "state_guard",
    "replay_containment",
    "dependency_invalidation",
    "lineage_append",
    "audit_append",
    "determinism_validation",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashProposalRevocationValue("proposal-revocation-stage", { stage, reasons }),
  })));
}

function validateRootRequest(input: ProposalRevocationInput): ProposalRevocationError[] {
  const errors: ProposalRevocationError[] = [];
  if (!input.request.proposalId || input.request.executionAuthorized !== false) {
    errors.push({
      code: "PROPOSAL_REVOCATION_PROPOSAL_MISSING",
      message: "Revocation requires a concrete proposal id and non-executable authority posture.",
      path: "request",
    });
  }
  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "PROPOSAL_REVOCATION_AUDIT_CORRUPTION",
      message: "Existing revocation audit chain is invalid.",
      path: "existingAuditLedger",
    });
  }
  if (input.request.proposalId !== input.proposalIntegrityResult.proposal.proposalId) {
    errors.push({
      code: "PROPOSAL_REVOCATION_HISTORICAL_TRUTH_CONFLICT",
      message: "Revocation request proposal id does not match immutable proposal integrity ancestry.",
      path: "request.proposalId",
    });
  }
  return errors;
}

function buildAuditEntries(input: {
  revocationId: string;
  proposalId: string;
  timestamp: string;
  invalidationHashes: readonly string[];
  lineageHash: string;
  replayPolicyHash: string;
  failedClosed: boolean;
}): readonly RevocationAuditEntry[] {
  const eventTypes: readonly RevocationAuditEntry["eventType"][] = input.failedClosed
    ? Object.freeze([
        "REVOCATION_REQUESTED",
        "REVOCATION_VALIDATED",
        "REVOCATION_FAILED_CLOSED",
      ])
    : Object.freeze([
        "REVOCATION_REQUESTED",
        "REVOCATION_VALIDATED",
        "PROPOSAL_REVOKED",
        "DEPENDENCY_INVALIDATED",
        "APPROVAL_REVOKED",
        "REPLAY_REVOKED",
        "GOVERNANCE_CONTAINED",
        "REVOCATION_COMPLETED",
      ]);

  return Object.freeze(eventTypes.map((eventType, index) => buildRevocationAuditEntry({
    revocationId: input.revocationId,
    proposalId: input.proposalId,
    eventType,
    timestamp: input.timestamp,
    inputHash: hashProposalRevocationValue("proposal-revocation-audit-input", { revocationId: input.revocationId, eventType, index }),
    outputHash: hashProposalRevocationValue("proposal-revocation-audit-output", {
      lineageHash: input.lineageHash,
      replayPolicyHash: input.replayPolicyHash,
      invalidationHashes: input.invalidationHashes,
      eventType,
    }),
    previousAuditHash: index > 0 ? `${input.revocationId}:${eventTypes[index - 1]}` : undefined,
  })));
}

export function revokeProposal(input: ProposalRevocationInput): ProposalRevocationResult {
  const errors: ProposalRevocationError[] = [...validateRootRequest(input)];
  errors.push(
    ...validateProposalRevocationGovernance(input),
    ...validateProposalRevocationReplay(input),
    ...validateProposalRevocationDependencies(input),
    ...validateProposalRevocationApprovals(input),
    ...validateProposalRevocationState(input),
  );

  const replayContainment = validateReplayRevocationContainment(input);
  errors.push(...replayContainment.errors);

  const revocationId = input.existingLineage?.revocationId
    ?? `proposal-revocation:${input.request.proposalId}:${hashProposalRevocationValue("proposal-revocation-id", input.request).slice(0, 12)}`;
  const invalidations = buildDependencyInvalidations(input);
  const lineage = appendRevocationLineage({
    revocationId,
    existing: input.existingLineage,
    request: input.request,
    invalidations,
    governanceBindingId: input.proposalStateEngineResult.governanceBinding.bindingId,
  });

  const preStatus = resolveProposalRevocationState({
    errors,
    cascadeComplete: errors.length === 0,
  });
  const propagation = propagateProposalRevocation({
    proposalId: input.request.proposalId,
    revocationState: preStatus,
  });

  const auditEntries = buildAuditEntries({
    revocationId,
    proposalId: input.request.proposalId,
    timestamp: input.evaluatedAt,
    invalidationHashes: invalidations.map((item) => item.deterministicHash),
    lineageHash: lineage.lineageHash,
    replayPolicyHash: replayContainment.replayPolicy.policyHash,
    failedClosed: errors.length > 0,
  });
  const auditLedger = auditEntries.reduce(
    (ledger, entry) => appendRevocationAuditLedger({ existing: ledger, entry }),
    input.existingAuditLedger ?? [],
  );
  if (!verifyImmutableLedgerChain([...auditLedger])) {
    errors.push({
      code: "PROPOSAL_REVOCATION_AUDIT_CORRUPTION",
      message: "Revocation audit append did not preserve immutable chain integrity.",
      path: "auditLedger",
    });
  }

  errors.push(...validateProposalRevocationDeterminism({
    request: input.request,
    lineage,
    replayPolicy: replayContainment.replayPolicy,
    auditEntries,
  }));

  const status = resolveProposalRevocationState({
    errors,
    cascadeComplete: errors.length === 0,
  });

  return Object.freeze({
    status,
    revocationId,
    request: input.request,
    lineage,
    invalidations,
    replayPolicy: replayContainment.replayPolicy,
    propagation,
    auditEntries,
    auditLedger,
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      errors.length === 0
        ? ["Proposal revocation completed as a containment-only cascade."]
        : ["Proposal revocation failed closed and preserved immutable historical truth."],
    ),
    stages: buildStages(errors),
    deterministicHash: hashProposalRevocationValue("proposal-revocation-result", canonicalizeProposalRevocationToString({
      request: input.request,
      lineage,
      invalidations,
      replayPolicy: replayContainment.replayPolicy,
      propagation,
      auditHashes: auditEntries.map((entry) => entry.auditHash),
      errorCodes: errors.map((error) => error.code),
      status,
    })),
    derivedOnly: true as const,
  });
}

export const ProposalRevocationEngine = revokeProposal;
