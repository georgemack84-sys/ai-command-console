import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { appendProposalReplayAuditEntry, buildProposalReplayAuditRecord } from "./replayAuditBridge";
import { canonicalizeProposalReplayToString } from "./replayCanonicalizer";
import { certifyProposalReplayDeterminism } from "./replayDeterminismCertifier";
import { validateProposalReplayDrift } from "./replayDriftValidator";
import { resolveProposalReplayStatus } from "./replayFailClosedGuard";
import { hashProposalReplayValue } from "./replayHasher";
import { auditProposalReplayLineage } from "./replayLineageAuditor";
import { loadProposalReplaySnapshots } from "./replaySnapshotLoader";
import { validateReplayApprovalSnapshots } from "./replayApprovalValidator";
import { validateReplayAuthorityBoundary } from "./replayAuthorityValidator";
import { resolveReplayAuthoritySnapshot } from "./replayAuthoritySnapshotResolver";
import { resolveReplayDependencySnapshots } from "./replayDependencySnapshotResolver";
import { validateReplayDependencySnapshots } from "./replayDependencyValidator";
import { validateReplayFreezeState } from "./replayFreezeValidator";
import { validateReplayGovernance } from "./replayGovernanceValidator";
import { resolveReplayGovernanceSnapshot } from "./replayGovernanceSnapshotResolver";
import { validateReplayIsolation } from "./replayIsolationGuard";
import { resolveReplayPolicySnapshot } from "./replayPolicySnapshotResolver";
import { validateReplayRevocationState } from "./replayRevocationValidator";
import { resolveReplayValidatorSnapshotIds } from "./replayValidatorVersionResolver";
import type {
  ProposalReplay,
  ProposalReplayAuditEventType,
  ProposalReplayAuditRecord,
  ProposalReplayError,
  ProposalReplayInput,
  ProposalReplayResult,
  ProposalReplayStageRecord,
} from "./replayTypes";

function buildReplay(
  input: ProposalReplayInput,
  dependencies: {
    governanceSnapshotId: string;
    policySnapshotId: string;
    validatorSnapshotIds: readonly string[];
    approvalSnapshotIds: readonly string[];
    dependencySnapshotIds: readonly string[];
    authoritySnapshotId: string;
  },
): ProposalReplay {
  const proposal = input.proposalIntegrityResult.proposal;
  const replayId = `proposal-replay:${proposal.proposalId}:${hashProposalReplayValue("proposal-replay-id", {
    proposalId: proposal.proposalId,
    proposalSnapshotId: input.proposalIntegrityResult.snapshot.snapshotId,
    governanceSnapshotId: dependencies.governanceSnapshotId,
    replayContractId: input.proposalGovernanceBindingResult.binding.replayContractId,
  }).slice(0, 12)}`;

  const replayCore = {
    replayId,
    proposalId: proposal.proposalId,
    proposalSnapshotId: input.proposalIntegrityResult.snapshot.snapshotId,
    governanceSnapshotId: dependencies.governanceSnapshotId,
    policySnapshotId: dependencies.policySnapshotId,
    validatorSnapshotIds: dependencies.validatorSnapshotIds,
    approvalSnapshotIds: dependencies.approvalSnapshotIds,
    dependencySnapshotIds: dependencies.dependencySnapshotIds,
    authoritySnapshotId: dependencies.authoritySnapshotId,
    replayContractId: input.proposalGovernanceBindingResult.binding.replayContractId,
    reconstructedLifecycle: Object.freeze([
      ...input.proposalStateEngineResult.lineage.transitionIds,
      `current:${input.proposalStateEngineResult.lineage.currentState}`,
    ]),
    reconstructedGovernance: Object.freeze([
      dependencies.governanceSnapshotId,
      dependencies.policySnapshotId,
      input.proposalGovernanceBindingResult.snapshot.governanceVersion,
      input.proposalGovernanceBindingResult.snapshot.constitutionalRulesHash,
    ]),
    reconstructedApprovals: Object.freeze([
      ...input.proposalIntegrityResult.approvalBinding.approvalDependencyIds,
      input.proposalGovernanceBindingResult.approvalRequirementBinding.approvalRequirementSetId,
    ]),
    reconstructedDependencies: dependencies.dependencySnapshotIds,
    reconstructedAuthority: Object.freeze([
      dependencies.authoritySnapshotId,
      `max:${input.proposalGovernanceBindingResult.authorityBoundary.maxAuthorityLevel}`,
      ...input.proposalGovernanceBindingResult.authorityBoundary.allowedScopes.map((scope) => `allow:${scope}`),
      ...input.proposalGovernanceBindingResult.authorityBoundary.forbiddenScopes.map((scope) => `deny:${scope}`),
    ]),
    deterministic: true,
    replayedAt: input.replayedAt,
  };

  return Object.freeze({
    ...replayCore,
    replayHash: hashProposalReplayValue("proposal-replay-record", replayCore),
  });
}

function buildAuditRecords(input: {
  replay: ProposalReplay;
  driftsDetected: boolean;
  certified: boolean;
  failed: boolean;
  replayedAt: string;
}): readonly ProposalReplayAuditRecord[] {
  const eventTypes: ProposalReplayAuditEventType[] = [
    "replay.started",
    "replay.snapshot.loaded",
    "replay.governance.bound",
    "replay.validator.bound",
    "replay.dependencies.bound",
    "replay.authority.bound",
  ];

  if (input.driftsDetected) {
    eventTypes.push("replay.drift.detected");
  }

  eventTypes.push(input.failed ? "replay.failed" : "replay.certified");

  return Object.freeze(eventTypes.map((eventType, index) => buildProposalReplayAuditRecord({
    replayId: input.replay.replayId,
    proposalId: input.replay.proposalId,
    eventType,
    timestamp: input.replayedAt,
    inputHash: hashProposalReplayValue("proposal-replay-audit-input", {
      replayId: input.replay.replayId,
      eventType,
      index,
    }),
    outputHash: input.replay.replayHash,
    previousEntryHash: index === 0 ? undefined : undefined,
  })));
}

function buildStages(errors: readonly ProposalReplayError[]): readonly ProposalReplayStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "snapshot_load",
    "lineage_audit",
    "governance_validation",
    "authority_validation",
    "dependency_validation",
    "approval_validation",
    "freeze_validation",
    "revocation_validation",
    "isolation_validation",
    "drift_validation",
    "determinism_certification",
    "audit_append",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashProposalReplayValue("proposal-replay-stage", { stage, reasons }),
  })));
}

export function replayProposal(
  input: ProposalReplayInput,
): ProposalReplayResult {
  const errors: ProposalReplayError[] = [];

  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "PROPOSAL_REPLAY_LINEAGE_CORRUPTED",
      message: "Existing proposal replay audit ledger is not append-only valid.",
      path: "existingAuditLedger",
    });
  }

  const snapshotLoad = loadProposalReplaySnapshots(input);
  errors.push(...snapshotLoad.errors);

  const lineageAudit = auditProposalReplayLineage(input);
  errors.push(...lineageAudit.errors);

  const governanceSnapshotId = resolveReplayGovernanceSnapshot(snapshotLoad.snapshotBundle);
  const policySnapshotId = resolveReplayPolicySnapshot(snapshotLoad.snapshotBundle);
  const validatorSnapshotIds = resolveReplayValidatorSnapshotIds(snapshotLoad.snapshotBundle);
  const approvalSnapshotIds = Object.freeze([
    ...input.proposalIntegrityResult.approvalBinding.approvalDependencyIds,
  ]);
  const dependencySnapshotIds = resolveReplayDependencySnapshots(input);
  const authoritySnapshotId = resolveReplayAuthoritySnapshot(snapshotLoad.snapshotBundle);

  if (validatorSnapshotIds.some((value) => value.length === 0)) {
    errors.push({
      code: "PROPOSAL_REPLAY_VALIDATOR_VERSION_UNAVAILABLE",
      message: "Proposal replay requires the original validator version set to remain fully available.",
      path: "proposalGovernanceBindingResult.validatorVersionSet",
    });
  }

  errors.push(
    ...validateReplayGovernance(input, snapshotLoad.snapshotBundle),
    ...validateReplayAuthorityBoundary(snapshotLoad.snapshotBundle.authorityBoundary),
    ...validateReplayDependencySnapshots(input),
    ...validateReplayApprovalSnapshots(input),
    ...validateReplayFreezeState(input),
    ...validateReplayRevocationState(input),
    ...validateReplayIsolation(input),
  );

  const replay = buildReplay(input, {
    governanceSnapshotId,
    policySnapshotId,
    validatorSnapshotIds,
    approvalSnapshotIds,
    dependencySnapshotIds,
    authoritySnapshotId,
  });

  const drifts = validateProposalReplayDrift({
    replayInput: input,
    replay,
    errors,
  });

  const auditRecords = buildAuditRecords({
    replay,
    driftsDetected: drifts.length > 0,
    certified: false,
    failed: false,
    replayedAt: input.replayedAt,
  });

  const auditLedger = auditRecords.reduce<readonly import("./replayTypes").ProposalReplayLedgerEntry[]>(
    (ledger, record) => appendProposalReplayAuditEntry({ existing: ledger, record }),
    input.existingAuditLedger ?? [],
  );

  if (!verifyImmutableLedgerChain([...auditLedger])) {
    errors.push({
      code: "PROPOSAL_REPLAY_AUDIT_HASH_MISMATCH",
      message: "Proposal replay audit append did not preserve immutable chain integrity.",
      path: "auditLedger",
    });
  }

  const certificationResult = certifyProposalReplayDeterminism({
    replay,
    snapshotBundle: snapshotLoad.snapshotBundle,
    lineage: lineageAudit.lineage,
    drifts,
    auditRecords,
  });
  errors.push(...certificationResult.errors);

  const status = resolveProposalReplayStatus({ errors });

  return Object.freeze({
    status,
    replay: Object.freeze({
      ...replay,
      deterministic: certificationResult.certification.certified,
    }),
    drifts,
    lineage: lineageAudit.lineage,
    snapshotBundle: snapshotLoad.snapshotBundle,
    auditRecords,
    auditLedger,
    certification: certificationResult.certification,
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      errors.length === 0
        ? ["Proposal replay remained bound to original immutable historical truth."]
        : ["Proposal replay preserved containment and failed closed where history could not be safely reconstructed."],
    ),
    stages: buildStages(errors),
    deterministicHash: hashProposalReplayValue("proposal-replay-result", canonicalizeProposalReplayToString({
      replayHash: replay.replayHash,
      driftHashes: drifts.map((drift) => drift.driftId),
      lineageHash: lineageAudit.lineage.replayLineageHash,
      auditHashes: auditRecords.map((record) => record.entryHash),
      status,
      errorCodes: errors.map((error) => error.code),
      certificationHash: certificationResult.certification.certificationHash,
    })),
    derivedOnly: true as const,
  });
}

export const ProposalReplayEngine = replayProposal;
