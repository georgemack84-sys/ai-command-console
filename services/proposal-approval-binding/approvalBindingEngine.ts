import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { appendApprovalAuditEntry, buildApprovalAuditEntry } from "./approvalAuditBridge";
import { resolveApprovalAdmissibility } from "./approvalAdmissibilityEngine";
import { canonicalizeApprovalToString } from "./approvalCanonicalizer";
import { validateApprovalAuthority } from "./approvalAuthorityValidator";
import { validateApprovalDependencies } from "./approvalDependencyValidator";
import { resolveApprovalBindingStatus } from "./approvalFailClosedGuard";
import { validateApprovalFreezeState } from "./approvalFreezeValidator";
import { validateApprovalGovernance } from "./approvalGovernanceValidator";
import { hashApprovalValue } from "./approvalHashEngine";
import { auditApprovalLineage } from "./approvalLineageAuditor";
import { buildApprovalLineage } from "./approvalLineageRegistry";
import { buildApprovalReplayBinding } from "./approvalReplayBindings";
import { validateApprovalReplayBinding } from "./approvalReplayValidator";
import { validateApprovalBindingValidity } from "./approvalValidityValidator";
import { validateApprovalValidityWindow } from "./approvalValidityWindowEngine";
import { bindOperatorOverride } from "./operatorOverrideBinding";
import { enforceOperatorSupremacy } from "./operatorSupremacyEnforcer";
import { buildOverrideLineage } from "./overrideLineageRegistry";
import { propagateApprovalRevocation } from "./approvalRevocationPropagator";
import { validateOverrideReplayBinding } from "./overrideReplayValidator";
import type {
  ApprovalAuditEntry,
  ApprovalAuditEventType,
  ApprovalBinding,
  ApprovalGovernanceBinding,
  ApprovalReplayResult,
  ProposalApprovalBindingError,
  ProposalApprovalBindingInput,
  ProposalApprovalBindingResult,
  ProposalApprovalBindingStageRecord,
} from "./types/proposalApprovalBindingTypes";

function buildApprovalGovernanceBinding(
  input: ProposalApprovalBindingInput,
): ApprovalGovernanceBinding {
  const binding = input.proposalGovernanceBindingResult.binding;
  const core = {
    governanceBindingId: `approval-governance-binding:${binding.bindingId}`,
    proposalId: binding.proposalId,
    governanceSnapshotId: binding.governanceSnapshotId,
    policySnapshotId: binding.policySnapshotId,
    authorityBoundaryId: binding.authorityBoundaryId,
    approvalRequirementSetId: binding.approvalRequirementSetId,
    validatorVersionSetId: binding.validatorVersionSetId,
    immutable: true as const,
  };

  return Object.freeze({
    ...core,
    bindingHash: hashApprovalValue("approval-governance-binding", core),
  });
}

function buildApprovalBinding(input: {
  engineInput: ProposalApprovalBindingInput;
  status: ProposalApprovalBindingResult["status"];
  overrideBindingIds: readonly string[];
}): ApprovalBinding {
  const proposal = input.engineInput.proposalIntegrityResult.proposal;
  const governance = input.engineInput.proposalGovernanceBindingResult;
  const replay = input.engineInput.proposalReplayResult.replay;

  const bindingCore = {
    bindingId: `approval-binding:${proposal.proposalId}`,
    proposalId: proposal.proposalId,
    governanceSnapshotId: governance.binding.governanceSnapshotId,
    policySnapshotId: governance.binding.policySnapshotId,
    authorityBoundaryId: governance.authorityBoundary.authorityBoundaryId,
    replayId: replay.replayId,
    approvalRequirementSetId: governance.approvalRequirementBinding.approvalRequirementSetId,
    validatorVersionSetId: governance.validatorVersionSet.validatorVersionSetId,
    validityWindowId: input.engineInput.validityWindow.validityWindowId,
    approvalIds: Object.freeze(input.engineInput.approvals.map((approval) => approval.approvalId)),
    dependencyIds: Object.freeze(input.engineInput.approvals.map((approval) => approval.dependencySnapshotId)),
    overrideBindingIds: Object.freeze([...input.overrideBindingIds]),
    status: input.status,
    immutable: true as const,
    createdAt: input.engineInput.evaluatedAt,
  };

  const bindingHash = hashApprovalValue("approval-binding", bindingCore);

  return Object.freeze({
    ...bindingCore,
    bindingHash,
    lineageHash: hashApprovalValue("approval-binding-lineage", {
      bindingHash,
      governanceSnapshotId: bindingCore.governanceSnapshotId,
      replayId: bindingCore.replayId,
      approvalIds: bindingCore.approvalIds,
    }),
  });
}

function buildApprovalReplayResult(input: {
  engineInput: ProposalApprovalBindingInput;
  binding: ApprovalBinding;
  replayable: boolean;
  overrideBindingId?: string;
  revocationId?: string;
}): ApprovalReplayResult {
  const replayCore = {
    replayable: input.replayable,
    replayId: input.engineInput.proposalReplayResult.replay.replayId,
    reconstructedApprovalIds: Object.freeze(input.engineInput.approvals.map((approval) => approval.approvalId)),
    reconstructedGovernanceBindings: Object.freeze([input.engineInput.proposalGovernanceBindingResult.binding.bindingId]),
    reconstructedDependencyIds: Object.freeze(input.engineInput.approvals.map((approval) => approval.dependencySnapshotId)),
    reconstructedValidityWindowIds: Object.freeze([input.engineInput.validityWindow.validityWindowId]),
    reconstructedAuthorityBoundaryIds: Object.freeze([input.engineInput.proposalGovernanceBindingResult.authorityBoundary.authorityBoundaryId]),
    reconstructedOverrideBindingIds: Object.freeze(input.overrideBindingId ? [input.overrideBindingId] : []),
    reconstructedRevocationIds: Object.freeze(input.revocationId ? [input.revocationId] : []),
    deterministic: true as const,
  };

  return Object.freeze({
    ...replayCore,
    replayHash: hashApprovalValue("approval-replay-result", {
      bindingId: input.binding.bindingId,
      ...replayCore,
    }),
  });
}

function buildAuditEntries(input: {
  proposalId: string;
  bindingId: string;
  timestamp: string;
  status: ProposalApprovalBindingResult["status"];
  overridePresent: boolean;
}): readonly ApprovalAuditEntry[] {
  const eventTypes: ApprovalAuditEventType[] = [
    "approval.bound",
    "approval.validated",
    "approval.replayed",
  ];

  if (input.overridePresent) {
    eventTypes.push("override.bound", "override.replayed");
  }

  if (input.status === "REVOKED") {
    eventTypes.push("approval.revoked");
  } else if (input.status === "FROZEN") {
    eventTypes.push("admissibility.denied");
  } else if (input.status === "FAILED_CLOSED") {
    eventTypes.push("approval.rejected", "replay.rejected");
  }

  return Object.freeze(eventTypes.map((eventType, index) => buildApprovalAuditEntry({
    proposalId: input.proposalId,
    bindingId: input.bindingId,
    eventType,
    timestamp: input.timestamp,
    inputHash: hashApprovalValue("approval-audit-input", {
      proposalId: input.proposalId,
      bindingId: input.bindingId,
      eventType,
      index,
    }),
    outputHash: hashApprovalValue("approval-audit-output", {
      proposalId: input.proposalId,
      bindingId: input.bindingId,
      status: input.status,
      eventType,
    }),
  })));
}

function buildStages(errors: readonly ProposalApprovalBindingError[]): readonly ProposalApprovalBindingStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));

  return Object.freeze([
    "governance_validation",
    "authority_validation",
    "dependency_validation",
    "validity_window_validation",
    "replay_validation",
    "freeze_validation",
    "override_enforcement",
    "revocation_propagation",
    "lineage_audit",
    "audit_append",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashApprovalValue("approval-stage", { stage, reasons }),
  })));
}

export function bindProposalApproval(
  input: ProposalApprovalBindingInput,
): ProposalApprovalBindingResult {
  const errors: ProposalApprovalBindingError[] = [];

  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_FAIL_CLOSED",
      message: "Existing proposal approval audit ledger is not append-only valid.",
      path: "existingAuditLedger",
    });
  }

  const overrideResult = bindOperatorOverride(input);
  errors.push(
    ...overrideResult.errors,
    ...validateApprovalGovernance(input),
    ...validateApprovalAuthority(input.proposalGovernanceBindingResult.authorityBoundary),
    ...validateApprovalDependencies(input),
    ...validateApprovalValidityWindow({
      validityWindow: input.validityWindow,
      evaluatedAt: input.evaluatedAt,
    }),
    ...validateApprovalBindingValidity({
      approvals: input.approvals,
      approvalRequirementBinding: input.proposalGovernanceBindingResult.approvalRequirementBinding,
    }),
    ...validateApprovalReplayBinding(input),
    ...validateApprovalFreezeState(input),
    ...enforceOperatorSupremacy(overrideResult.overrideBinding),
    ...validateOverrideReplayBinding({
      overrideBinding: overrideResult.overrideBinding,
      proposalReplayResult: input.proposalReplayResult,
    }),
  );

  const status = resolveApprovalBindingStatus({
    engineInput: input,
    errors,
    overrideBinding: overrideResult.overrideBinding,
  });

  const binding = buildApprovalBinding({
    engineInput: input,
    status,
    overrideBindingIds: overrideResult.overrideBinding
      ? [overrideResult.overrideBinding.overrideBindingId]
      : [],
  });

  const revocation = propagateApprovalRevocation(input, overrideResult.overrideBinding);
  const governanceBinding = buildApprovalGovernanceBinding(input);
  const replayBinding = buildApprovalReplayBinding(input, errors.length === 0 && status === "BOUND");

  const auditEntries = buildAuditEntries({
    proposalId: binding.proposalId,
    bindingId: binding.bindingId,
    timestamp: input.evaluatedAt,
    status,
    overridePresent: Boolean(overrideResult.overrideBinding),
  });

  const auditLedger = auditEntries.reduce<readonly import("./types/proposalApprovalBindingTypes").ProposalApprovalBindingLedgerEntry[]>(
    (ledger, record) => appendApprovalAuditEntry({ existing: ledger, record }),
    input.existingAuditLedger ?? [],
  );

  if (!verifyImmutableLedgerChain([...auditLedger])) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_FAIL_CLOSED",
      message: "Approval audit append failed to preserve immutable ledger integrity.",
      path: "auditLedger",
    });
  }

  const lineage = buildApprovalLineage({
    engineInput: input,
    binding,
    auditEventIds: auditEntries.map((entry) => entry.auditEntryId),
    revocation,
    overrideBindingId: overrideResult.overrideBinding?.overrideBindingId,
  });
  errors.push(...auditApprovalLineage(lineage));

  const overrideLineage = buildOverrideLineage({
    engineInput: input,
    overrideBinding: overrideResult.overrideBinding,
  });

  const replayResult = buildApprovalReplayResult({
    engineInput: input,
    binding,
    replayable: errors.length === 0 && status === "BOUND",
    overrideBindingId: overrideResult.overrideBinding?.overrideBindingId,
    revocationId: revocation?.revocationId,
  });

  const admissibility = resolveApprovalAdmissibility({
    status,
    errors,
    overrideBinding: overrideResult.overrideBinding,
  });

  return Object.freeze({
    status,
    binding,
    governanceBinding,
    replayBinding,
    replayResult,
    admissibility,
    lineage,
    overrideLineage,
    approvals: Object.freeze([...input.approvals]),
    validityWindow: input.validityWindow,
    overrideBinding: overrideResult.overrideBinding,
    revocation,
    auditEntries,
    auditLedger,
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      errors.length === 0
        ? ["Proposal approval binding remained replay-safe and governance-bound."]
        : ["Proposal approval binding preserved containment and failed closed where immutable approval truth became ambiguous."],
    ),
    stages: buildStages(errors),
    deterministicHash: hashApprovalValue("proposal-approval-binding-result", canonicalizeApprovalToString({
      bindingHash: binding.bindingHash,
      governanceBindingHash: governanceBinding.bindingHash,
      replayBindingHash: replayBinding.bindingHash,
      replayHash: replayResult.replayHash,
      admissibilityHash: admissibility.deterministicHash,
      lineageHash: lineage.lineageHash,
      overrideLineageHash: overrideLineage.lineageHash,
      auditHashes: auditEntries.map((entry) => entry.entryHash),
      errorCodes: errors.map((error) => error.code),
      status,
    })),
    derivedOnly: true as const,
  });
}

export const ProposalApprovalBindingEngine = bindProposalApproval;
