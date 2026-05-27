import type { ProposalLifecycleInput, ProposalRecord } from "@/types/proposal-lifecycle-engine";
import { validateProposalLifecycleSchema } from "./proposalLifecycleSchemas";
import { bindProposalGovernance } from "./proposalGovernanceBinder";
import { bindProposalSnapshots } from "./proposalSnapshotBinder";
import { bindProposalReplay } from "./proposalReplayBinder";
import { bindProposalSafeAction } from "./proposalSafeActionBinder";
import { evaluateProposalApproval } from "./proposalApprovalEngine";
import { evaluateProposalRevocation } from "./proposalRevocationEngine";
import { validateProposalLifecycle } from "./proposalLifecycleValidator";
import { guardProposalLifecycleInput } from "./proposalLifecycleGuards";
import { resolveProposalTransition } from "./proposalStateMachine";
import { appendProposalLineage } from "./proposalLineageLedger";
import { prepareProposalHandoff } from "./proposalHandoffPreparer";
import { archiveProposalLineage } from "./proposalArchiveManager";
import { hashProposalLifecycleValue } from "./proposalLifecycleHasher";

export function buildProposalLifecycleRecord(input: ProposalLifecycleInput): ProposalRecord {
  const schemaErrors = validateProposalLifecycleSchema(input);
  const guardErrors = guardProposalLifecycleInput(input);
  const governanceBinding = bindProposalGovernance(input.governanceView);
  const snapshotBinding = bindProposalSnapshots(input.snapshots);
  const replayBinding = bindProposalReplay({
    replay: input.replay,
    readinessHash: input.readinessProfile.readinessHash,
    snapshotLineageHash: snapshotBinding.snapshotLineageHash,
  });
  const safeActionBinding = bindProposalSafeAction(input.safeActionProfile);
  const approvalEvaluation = evaluateProposalApproval({
    approval: input.approval,
    governanceDecisionHash: governanceBinding.governanceDecisionHash,
    timestamp: input.updatedAt,
  });
  const revocation = evaluateProposalRevocation({
    revocation: input.revocation,
    replayBinding,
  });
  const lifecycleErrors = validateProposalLifecycle({
    proposal: input,
    governanceValid: governanceBinding.valid,
    replayValid: replayBinding.valid,
    snapshotValid: snapshotBinding.valid,
    safeActionValid: safeActionBinding.valid,
    futureBound: safeActionBinding.futureBound,
    forbidden: safeActionBinding.forbidden,
    metadata: input.metadata,
  });

  const currentState = input.currentState ?? "draft";
  const preTransitionErrors = [...schemaErrors, ...guardErrors, ...approvalEvaluation.errors, ...lifecycleErrors];
  const transition = resolveProposalTransition({
    currentState,
    requestedTransition: input.requestedTransition,
    approvalValid: approvalEvaluation.approval.valid,
    revoked: revocation.status === "revoked",
    futureBound: safeActionBinding.futureBound,
    errorsPresent: preTransitionErrors.length > 0,
  });
  const errors = Object.freeze([...preTransitionErrors, ...transition.errors]);
  const resultingState = transition.resultingState;

  const provisionalHash = hashProposalLifecycleValue("proposal-lifecycle-provisional", {
    proposalId: input.proposalId,
    currentState,
    requestedTransition: input.requestedTransition,
    resultingState,
    governanceBinding,
    replayBinding,
    snapshotBinding,
    safeActionBinding,
    approval: approvalEvaluation.approval,
    revocation,
  });

  let lineage = appendProposalLineage({
    existing: input.lineage,
    transition: input.requestedTransition,
    fromState: currentState,
    toState: resultingState,
    timestamp: input.updatedAt,
    governanceHash: governanceBinding.governanceDecisionHash,
    replayHash: replayBinding.reconstructionHash,
    snapshotLineageHash: snapshotBinding.snapshotLineageHash,
    safeActionHash: safeActionBinding.safeActionHash,
  });
  lineage = archiveProposalLineage(lineage, resultingState);

  const handoffPreparation = prepareProposalHandoff({
    proposalId: input.proposalId,
    missionId: input.missionId,
    executionId: input.executionId,
    resultingState,
    timestamp: input.updatedAt,
    governanceBinding,
    replayBinding,
    snapshotBinding,
    safeActionBinding,
    approval: approvalEvaluation.approval,
    metadata: input.metadata,
  });
  const allErrors = Object.freeze([...errors, ...handoffPreparation.errors]);

  const proposalHash = hashProposalLifecycleValue("proposal-lifecycle-record", {
    proposalId: input.proposalId,
    currentState,
    requestedTransition: input.requestedTransition,
    resultingState,
    governanceBinding,
    replayBinding,
    snapshotBinding,
    safeActionBinding,
    approval: approvalEvaluation.approval,
    revocation,
    lineage,
    handoff: handoffPreparation.handoff,
    allErrors,
    provisionalHash,
  });

  return Object.freeze({
    proposalId: input.proposalId,
    missionId: input.missionId,
    executionId: input.executionId,
    title: input.title,
    summary: input.summary,
    currentState,
    requestedTransition: input.requestedTransition,
    resultingState,
    lifecycleDecision: allErrors.length === 0 ? "ALLOW" : "DENY",
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    governanceBinding,
    replayBinding,
    snapshotBinding,
    safeActionBinding,
    approval: approvalEvaluation.approval,
    revocation,
    lineage,
    handoff: handoffPreparation.handoff,
    warnings: Object.freeze([
      ...input.readinessProfile.warnings,
      ...(safeActionBinding.futureBound ? ["Future-bound safe action remains non-executing."] : []),
    ]),
    errors: allErrors,
    proposalHash,
    immutable: true,
  });
}
