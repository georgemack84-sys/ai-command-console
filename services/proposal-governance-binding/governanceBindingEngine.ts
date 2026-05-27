import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { validateAuthorityBinding } from "./authorityBindingValidator";
import { bindApprovalRequirements } from "./approvalRequirementBinder";
import { bindReplayContract } from "./replayContractBinder";
import { bindValidatorVersions } from "./validatorVersionBinder";
import { buildGovernanceBindingAuditRecord, appendGovernanceBindingAuditEntry } from "./governanceBindingAuditBridge";
import { canonicalizeGovernanceBindingToString } from "./governanceBindingCanonicalizer";
import { validateGovernanceBindingDeterminism } from "./governanceBindingDeterminismValidator";
import { resolveBindingStateForArtifact, resolveGovernanceBindingStatus } from "./governanceBindingFailClosedGuard";
import { hashGovernanceBindingValue } from "./governanceBindingHasher";
import { appendGovernanceLineageEvents } from "./governanceLineageLog";
import { validatePolicyBinding } from "./policyBindingValidator";
import { buildGovernanceSnapshot } from "./governanceSnapshotRegistry";
import { validateGovernanceBindingReplay } from "./governanceBindingReplayValidator";
import { validateGovernanceBindingFreeze } from "./governanceBindingFreezeValidator";
import { validateGovernanceBindingRevocation } from "./governanceBindingRevocationValidator";
import { validateGovernanceBindingState } from "./governanceBindingStateGuard";
import type {
  GovernanceBindingAuditRecord,
  GovernanceBindingInput,
  GovernanceBindingResult,
  ProposalGovernanceBinding,
  ProposalGovernanceBindingError,
  GovernanceBindingStageRecord,
} from "./governanceBindingTypes";

function buildStages(errors: readonly ProposalGovernanceBindingError[]): readonly GovernanceBindingStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "snapshot_registry",
    "policy_binding",
    "authority_binding",
    "replay_contract_binding",
    "validator_version_binding",
    "approval_requirement_binding",
    "replay_validation",
    "freeze_validation",
    "revocation_validation",
    "state_guard",
    "lineage_append",
    "audit_append",
    "determinism_validation",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashGovernanceBindingValue("proposal-governance-binding-stage", { stage, reasons }),
  })));
}

function buildBinding(input: {
  bindingInput: GovernanceBindingInput;
  replayContractId: string;
  bindingStatus: ProposalGovernanceBinding["bindingStatus"];
}): ProposalGovernanceBinding {
  const proposalId = input.bindingInput.proposalIntegrityResult.proposal.proposalId;
  const governanceSnapshotId = input.bindingInput.proposalIntegrityResult.proposal.governanceSnapshotId;
  const policySnapshotId = input.bindingInput.policySnapshotId;
  const authorityBoundaryId = input.bindingInput.authorityBoundary.authorityBoundaryId;
  const validatorVersionSetId = input.bindingInput.validatorVersionSet.validatorVersionSetId;
  const approvalRequirementSetId = input.bindingInput.approvalRequirementBinding.approvalRequirementSetId;

  const bindingCore = {
    proposalId,
    governanceSnapshotId,
    policySnapshotId,
    authorityBoundaryId,
    replayContractId: input.replayContractId,
    validatorVersionSetId,
    approvalRequirementSetId,
    bindingStatus: input.bindingStatus,
    immutable: true as const,
    createdAt: input.bindingInput.evaluatedAt,
  };

  const lineageHash = hashGovernanceBindingValue("proposal-governance-binding-lineage", {
    proposalId,
    governanceSnapshotId,
    policySnapshotId,
    authorityBoundaryId,
    replayContractId: input.replayContractId,
  });

  return Object.freeze({
    bindingId: input.bindingInput.existingBinding?.bindingId
      ?? `proposal-governance-binding:${proposalId}:${hashGovernanceBindingValue("proposal-governance-binding-id", bindingCore).slice(0, 12)}`,
    ...bindingCore,
    bindingHash: hashGovernanceBindingValue("proposal-governance-binding-record", bindingCore),
    lineageHash,
  });
}

function buildAuditRecords(input: {
  binding: ProposalGovernanceBinding;
  lineageEvents: readonly import("./governanceBindingTypes").GovernanceLineageEvent[];
  evaluatedAt: string;
}): readonly GovernanceBindingAuditRecord[] {
  return Object.freeze(input.lineageEvents.map((event, index) => buildGovernanceBindingAuditRecord({
    bindingId: input.binding.bindingId,
    proposalId: input.binding.proposalId,
    eventType: event.eventType,
    timestamp: input.evaluatedAt,
    inputHash: hashGovernanceBindingValue("proposal-governance-binding-audit-input", {
      bindingId: input.binding.bindingId,
      eventType: event.eventType,
      index,
    }),
    outputHash: event.eventHash,
  })));
}

export function bindProposalGovernance(
  input: GovernanceBindingInput,
): GovernanceBindingResult {
  const errors: ProposalGovernanceBindingError[] = [];

  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_LINEAGE_CORRUPTED",
      message: "Existing governance binding audit ledger is not append-only valid.",
      path: "existingAuditLedger",
    });
  }

  const snapshotResult = buildGovernanceSnapshot(input);
  errors.push(...snapshotResult.errors);
  errors.push(...validatePolicyBinding({ bindingInput: input, snapshot: snapshotResult.snapshot }));
  errors.push(...validateAuthorityBinding(input.authorityBoundary));

  const replayContract = bindReplayContract(input);
  errors.push(...replayContract.errors);

  const validatorVersions = bindValidatorVersions(input);
  errors.push(...validatorVersions.errors);

  const approvalRequirements = bindApprovalRequirements(input);
  errors.push(...approvalRequirements.errors);

  errors.push(
    ...validateGovernanceBindingReplay(input),
    ...validateGovernanceBindingFreeze(input),
    ...validateGovernanceBindingRevocation(input),
    ...validateGovernanceBindingState(input),
  );

  const status = resolveGovernanceBindingStatus({
    errors,
    freezeStatus: input.proposalFreezeResult.status,
    revocationStatus: input.proposalRevocationResult.status,
  });
  const bindingStatus = resolveBindingStateForArtifact(status);
  const binding = buildBinding({
    bindingInput: input,
    replayContractId: replayContract.replayContractId,
    bindingStatus,
  });
  const lineageEvents = appendGovernanceLineageEvents({
    existing: input.existingLineageEvents,
    binding,
    createdAt: input.evaluatedAt,
  });

  const auditRecords = buildAuditRecords({
    binding,
    lineageEvents,
    evaluatedAt: input.evaluatedAt,
  });
  const auditLedger = auditRecords.reduce<readonly import("./governanceBindingTypes").GovernanceBindingAuditLedgerEntry[]>(
    (ledger, record) => appendGovernanceBindingAuditEntry({ existing: ledger, record }),
    input.existingAuditLedger ?? [],
  );

  if (!verifyImmutableLedgerChain([...auditLedger])) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_LINEAGE_CORRUPTED",
      message: "Governance binding audit append did not preserve immutable chain integrity.",
      path: "auditLedger",
    });
  }

  errors.push(...validateGovernanceBindingDeterminism({
    binding,
    snapshot: snapshotResult.snapshot,
    lineageEvents,
    auditRecords,
  }));

  const finalStatus = errors.length > 0 ? "FAILED_CLOSED" : status;

  return Object.freeze({
    status: finalStatus,
    binding,
    snapshot: snapshotResult.snapshot,
    authorityBoundary: Object.freeze(input.authorityBoundary),
    validatorVersionSet: validatorVersions.validatorVersionSet,
    approvalRequirementBinding: approvalRequirements.approvalRequirementBinding,
    lineageEvents,
    auditRecords,
    auditLedger,
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      errors.length === 0
        ? ["Proposal governance binding remained anchored to its original constitutional context."]
        : ["Governance binding failed closed and preserved historical constitutional truth."],
    ),
    stages: buildStages(errors),
    deterministicHash: hashGovernanceBindingValue("proposal-governance-binding-result", canonicalizeGovernanceBindingToString({
      binding,
      snapshot: snapshotResult.snapshot,
      authorityBoundary: input.authorityBoundary,
      validatorVersionSet: validatorVersions.validatorVersionSet,
      approvalRequirementBinding: approvalRequirements.approvalRequirementBinding,
      lineageHashes: lineageEvents.map((event) => event.eventHash),
      auditHashes: auditRecords.map((record) => record.entryHash),
      errorCodes: errors.map((error) => error.code),
      status: finalStatus,
    })),
    derivedOnly: true as const,
  });
}

export const GovernanceBindingEngine = bindProposalGovernance;
