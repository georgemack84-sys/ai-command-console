import type { ConstitutionalCoordinationInput, ConstitutionalCoordinationLineageEntry, ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import { buildConstitutionalCoordinationAuthorityContract, createConstitutionalCoordinationError, enforceConstitutionalCoordinationBoundary } from "./coordinationBoundaryEnforcer";
import { resolveConstitutionalCeiling, resolveConstitutionalCoordinationState } from "./coordinationCeilingEngine";
import { bindGovernanceSnapshot } from "@/services/constitutional-governance/governanceBindingLayer";
import { bindConstitutionalPolicy } from "@/services/constitutional-governance/constitutionalPolicyBinder";
import { appendGovernanceChronology } from "@/services/constitutional-governance/governanceLineagePreserver";
import { validateGovernanceCeiling } from "@/services/constitutional-governance/governanceCeilingValidator";
import { bindReplayLineage } from "@/services/constitutional-replay/replayBindingLayer";
import { verifyDeterministicReplay } from "@/services/constitutional-replay/deterministicReplayVerifier";
import { bindEscalationLineage } from "@/services/constitutional-escalation/escalationBindingLayer";
import { trackEscalationCoordination } from "@/services/constitutional-escalation/escalationCoordinationTracker";
import { validateEscalationBoundary } from "@/services/constitutional-escalation/escalationBoundaryValidator";
import { validateConstitutionalConstraints } from "@/services/constitutional-validation/constitutionalConstraintValidator";
import { validateLineageIntegrity } from "@/services/constitutional-validation/lineageIntegrityValidator";
import { detectCoordinationMutation } from "@/services/constitutional-validation/coordinationMutationDetector";
import { buildConstitutionalValidation } from "@/services/constitutional-validation/coordinationValidator";
import { validateDeterministicState } from "@/services/constitutional-validation/deterministicStateValidator";
import { assembleConstitutionalCoordinationRecord } from "./constitutionalCoordinationAssembler";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function buildConstitutionalCoordinationCore(input: ConstitutionalCoordinationInput): ConstitutionalCoordinationRecord {
  const authorityContract = buildConstitutionalCoordinationAuthorityContract();
  const boundaryErrors = enforceConstitutionalCoordinationBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const governanceBinding = bindGovernanceSnapshot(input.proposal, input.createdAt);
  const governanceErrors = bindConstitutionalPolicy(governanceBinding);
  const replayBinding = bindReplayLineage({
    proposal: input.proposal,
    lifecycle: input.lifecycle,
    containmentRecord: input.containmentRecord,
    createdAt: input.createdAt,
  });
  const replayErrors = verifyDeterministicReplay(replayBinding);
  const escalationBinding = bindEscalationLineage(input.escalationRecord);
  const escalationErrors = validateEscalationBoundary(escalationBinding);
  const ceilingLevel = resolveConstitutionalCeiling(input.containmentRecord.validation.containmentState);
  const ceilingErrors = validateGovernanceCeiling({
    ceilingLevel,
    containmentRecord: input.containmentRecord,
  });
  const constraintErrors = validateConstitutionalConstraints(input.containmentRecord);
  const mutationErrors = detectCoordinationMutation(input.metadata);
  const lineageErrors = validateLineageIntegrity({
    governanceBinding,
    replayBinding,
    escalationBinding,
  });
  const escalationTracker = trackEscalationCoordination(input.escalationRecord);
  const resultingState = resolveConstitutionalCoordinationState({
    ceilingLevel,
    governanceValid: governanceErrors.length === 0,
    replayValid: replayErrors.length === 0,
    escalationBound: escalationTracker.escalationBound && escalationErrors.length === 0,
    errorsPresent: [
      ...boundaryErrors,
      ...governanceErrors,
      ...replayErrors,
      ...escalationErrors,
      ...ceilingErrors,
      ...constraintErrors,
      ...mutationErrors,
      ...lineageErrors,
    ].length > 0,
  });
  const reasons = Object.freeze([
    `containment:${input.containmentRecord.validation.containmentState}`,
    `ceiling:${ceilingLevel}`,
    `governance:${governanceBinding.valid ? "valid" : "invalid"}`,
    `replay:${replayBinding.valid ? "valid" : "invalid"}`,
  ]);
  const validation = buildConstitutionalValidation({
    containmentRecord: input.containmentRecord,
    resultingState,
    ceilingLevel,
    errors: [
      ...boundaryErrors,
      ...governanceErrors,
      ...replayErrors,
      ...escalationErrors,
      ...ceilingErrors,
      ...constraintErrors,
      ...mutationErrors,
      ...lineageErrors,
    ],
    reasons,
  });
  const provisionalHash = hashContainmentValue("constitutional-coordination-provisional", {
    coordinationId: input.coordinationId,
    resultingState,
    ceilingLevel,
    governanceBinding,
    replayBinding,
    escalationBinding,
  });
  const chronologyEntry: ConstitutionalCoordinationLineageEntry = Object.freeze({
    entryId: hashContainmentValue("constitutional-coordination-entry", {
      coordinationId: input.coordinationId,
      createdAt: input.createdAt,
      provisionalHash,
    }),
    coordinationId: input.coordinationId,
    coordinationState: resultingState,
    constitutionalCeilingLevel: ceilingLevel,
    deterministicHash: provisionalHash,
    createdAt: input.createdAt,
  });
  const chronology = appendGovernanceChronology({
    existing: input.existingChronology,
    entry: chronologyEntry,
  });
  const record = assembleConstitutionalCoordinationRecord({
    coordinationId: input.coordinationId,
    proposalId: input.proposal.proposalId,
    governanceBinding,
    replayBinding,
    escalationBinding,
    authorityContract,
    coordinationState: resultingState,
    constitutionalCeilingLevel: ceilingLevel,
    chronology,
    validation,
    createdAt: input.createdAt,
    warnings: Object.freeze([
      ...input.proposal.warnings,
      ...input.lifecycle.warnings,
      ...input.escalationRecord.warnings,
      ...input.missionGraph.warnings,
      ...input.containmentRecord.warnings,
      "Constitutional coordination remains governance-bound, deterministic, and non-executing.",
    ]),
    errors: Object.freeze([
      ...boundaryErrors,
      ...governanceErrors,
      ...replayErrors,
      ...escalationErrors,
      ...ceilingErrors,
      ...constraintErrors,
      ...mutationErrors,
      ...lineageErrors,
      ...(input.containmentRecord.validation.failClosed
        ? [createConstitutionalCoordinationError(
          "CONSTITUTIONAL_COORDINATION_CONTAINMENT_PRECEDENCE",
          "Containment fail-closed state cascades into constitutional coordination.",
          "containmentRecord.validation.failClosed",
        )]
        : []),
    ]),
  });
  const deterministicErrors = validateDeterministicState(record);
  return Object.freeze({
    ...record,
    errors: Object.freeze([...record.errors, ...deterministicErrors]),
  });
}

export const enforceConstitutionalCoordination = buildConstitutionalCoordinationCore;
