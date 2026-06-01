import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  ConfidenceClassification,
  DeterministicConfidenceResult,
  DeterministicConfidenceStatus,
} from "./types/confidenceTypes";
import type { GovernanceBindingResult } from "@/services/proposal-governance-binding/governanceBindingTypes";
import type { ProposalFreezeResult } from "@/services/proposal-freeze-layer/types/proposalFreezeTypes";
import type { ProposalIntegrityStatus } from "@/services/proposal-integrity/proposalIntegrityStatus";
import type { ProposalRevocationResult } from "@/services/proposal-revocation-engine/proposalRevocationTypes";

export type GovernanceAwareCautionReplayState =
  | "STABLE"
  | "UNSTABLE"
  | "DISPUTED"
  | "FAILED_CLOSED";

export type GovernanceAwareCautionLineageState =
  | "MATCHED"
  | "MISMATCHED"
  | "DISPUTED"
  | "UNKNOWN";

export type GovernanceAwareCautionPressure =
  | "LOW"
  | "ELEVATED"
  | "HIGH"
  | "CRITICAL";

export type GovernanceAwareCautionAction =
  | "OBSERVE"
  | "TIGHTEN_SCOPE"
  | "INCREASE_ESCALATION"
  | "FREEZE_RECOMMENDATION"
  | "REQUIRE_OPERATOR_REVIEW"
  | "FAIL_CLOSED";

export type GovernanceAwareCautionReasonCode =
  | "CONFIDENCE_COLLAPSE"
  | "REPLAY_INSTABILITY"
  | "GOVERNANCE_CONFLICT"
  | "AUTHORITY_AMBIGUITY"
  | "LINEAGE_MISMATCH"
  | "PROPOSAL_FROZEN_CONTAINMENT"
  | "PROPOSAL_REVOKED_CONTAINMENT"
  | "PROPOSAL_INTEGRITY_CONTAINMENT"
  | "CONFIDENCE_FAIL_CLOSED";

export type GovernanceAwareCautionBridgeInput = Readonly<{
  confidenceResult: DeterministicConfidenceResult;
  confidenceClassification?: ConfidenceClassification;
  replayValidationState: GovernanceAwareCautionReplayState;
  governanceBindingState: GovernanceBindingResult["status"];
  lineageIntegrityState: GovernanceAwareCautionLineageState;
  freezeState: ProposalFreezeResult["status"];
  revocationState: ProposalRevocationResult["status"];
  proposalIntegrityState?: ProposalIntegrityStatus;
  authorityAmbiguous?: boolean;
  recommendationId?: string;
}>;

export type GovernanceAwareCautionBridgeResult = Readonly<{
  recommendationId: string;
  governancePressure: GovernanceAwareCautionPressure;
  requiredAction: GovernanceAwareCautionAction;
  reasonCodes: readonly GovernanceAwareCautionReasonCode[];
  advisoryOnly: true;
  authorityChanged: false;
  mutationPerformed: false;
  replaySafe: boolean;
  failClosed: boolean;
  deterministicHash: string;
  canonicalBridgeHash: string;
  controlledAutonomyTrajectoryPreserved: true;
}>;

const ACTION_PRIORITY: Record<GovernanceAwareCautionAction, number> = Object.freeze({
  OBSERVE: 0,
  TIGHTEN_SCOPE: 1,
  INCREASE_ESCALATION: 2,
  FREEZE_RECOMMENDATION: 3,
  REQUIRE_OPERATOR_REVIEW: 4,
  FAIL_CLOSED: 5,
});

function isConfidenceCollapse(
  classification: ConfidenceClassification,
  status: DeterministicConfidenceStatus,
): boolean {
  return status === "FAILED_CLOSED" || classification === "very_low" || classification === "low";
}

function isReplayUnstable(input: GovernanceAwareCautionBridgeInput): boolean {
  return input.replayValidationState !== "STABLE"
    || !input.confidenceResult.certification.certified
    || input.confidenceResult.drifts.some((drift) => drift.frozen || drift.severity === "critical");
}

function isGovernanceConflict(state: GovernanceBindingResult["status"]): boolean {
  return state !== "BOUND";
}

function isProposalFrozen(state: ProposalFreezeResult["status"]): boolean {
  return state !== "ACTIVE";
}

function isProposalRevoked(state: ProposalRevocationResult["status"]): boolean {
  return state !== "NOT_REVOKED";
}

function isProposalIntegrityContained(state: ProposalIntegrityStatus | undefined): boolean {
  return state === "frozen"
    || state === "revoked"
    || state === "replay_failed"
    || state === "superseded";
}

function chooseAction(actions: readonly GovernanceAwareCautionAction[]): GovernanceAwareCautionAction {
  return actions.reduce<GovernanceAwareCautionAction>((selected, action) =>
    ACTION_PRIORITY[action] > ACTION_PRIORITY[selected] ? action : selected, "OBSERVE");
}

function pressureForAction(action: GovernanceAwareCautionAction): GovernanceAwareCautionPressure {
  switch (action) {
    case "OBSERVE":
      return "LOW";
    case "TIGHTEN_SCOPE":
      return "ELEVATED";
    case "INCREASE_ESCALATION":
    case "FREEZE_RECOMMENDATION":
    case "REQUIRE_OPERATOR_REVIEW":
      return "HIGH";
    case "FAIL_CLOSED":
      return "CRITICAL";
  }
}

function normalizeReasons(
  reasons: readonly GovernanceAwareCautionReasonCode[],
): readonly GovernanceAwareCautionReasonCode[] {
  return Object.freeze([...new Set(reasons)].sort());
}

export function buildGovernanceAwareCautionBridge(
  input: GovernanceAwareCautionBridgeInput,
): GovernanceAwareCautionBridgeResult {
  const classification = input.confidenceClassification ?? input.confidenceResult.score.classification;
  const actions: GovernanceAwareCautionAction[] = ["OBSERVE"];
  const reasons: GovernanceAwareCautionReasonCode[] = [];

  if (isConfidenceCollapse(classification, input.confidenceResult.status)) {
    actions.push("TIGHTEN_SCOPE");
    reasons.push("CONFIDENCE_COLLAPSE");
  }

  if (isReplayUnstable(input)) {
    actions.push("INCREASE_ESCALATION");
    reasons.push("REPLAY_INSTABILITY");
  }

  if (isGovernanceConflict(input.governanceBindingState)) {
    actions.push("FREEZE_RECOMMENDATION");
    reasons.push("GOVERNANCE_CONFLICT");
  }

  if (input.authorityAmbiguous === true) {
    actions.push("REQUIRE_OPERATOR_REVIEW");
    reasons.push("AUTHORITY_AMBIGUITY");
  }

  if (input.lineageIntegrityState !== "MATCHED") {
    actions.push("FAIL_CLOSED");
    reasons.push("LINEAGE_MISMATCH");
  }

  if (isProposalFrozen(input.freezeState)) {
    actions.push("FREEZE_RECOMMENDATION");
    reasons.push("PROPOSAL_FROZEN_CONTAINMENT");
  }

  if (isProposalRevoked(input.revocationState)) {
    actions.push("FREEZE_RECOMMENDATION");
    reasons.push("PROPOSAL_REVOKED_CONTAINMENT");
  }

  if (isProposalIntegrityContained(input.proposalIntegrityState)) {
    actions.push("FREEZE_RECOMMENDATION");
    reasons.push("PROPOSAL_INTEGRITY_CONTAINMENT");
  }

  if (input.confidenceResult.status === "FAILED_CLOSED") {
    actions.push("FAIL_CLOSED");
    reasons.push("CONFIDENCE_FAIL_CLOSED");
  }

  const requiredAction = chooseAction(actions);
  const reasonCodes = normalizeReasons(reasons);
  const failClosed = requiredAction === "FAIL_CLOSED";
  const replaySafe = !failClosed && input.replayValidationState === "STABLE";
  const recommendationId = input.recommendationId
    ?? input.confidenceResult.score.recommendationId
    ?? input.confidenceResult.score.confidenceId;

  const bridgeCore = Object.freeze({
    recommendationId,
    governancePressure: pressureForAction(requiredAction),
    requiredAction,
    reasonCodes,
    advisoryOnly: true as const,
    authorityChanged: false as const,
    mutationPerformed: false as const,
    replaySafe,
    failClosed,
    controlledAutonomyTrajectoryPreserved: true as const,
  });
  const canonicalBridgeHash = hashConfidenceValue(
    "governance-aware-caution-bridge",
    canonicalizeConfidenceToString({
      ...bridgeCore,
      confidenceHash: input.confidenceResult.deterministicHash,
      confidenceOutputHash: input.confidenceResult.score.outputHash,
      confidenceLineageHash: input.confidenceResult.score.lineageHash,
      replayValidationState: input.replayValidationState,
      governanceBindingState: input.governanceBindingState,
      lineageIntegrityState: input.lineageIntegrityState,
      freezeState: input.freezeState,
      revocationState: input.revocationState,
      proposalIntegrityState: input.proposalIntegrityState ?? null,
    }),
  );

  return Object.freeze({
    ...bridgeCore,
    deterministicHash: canonicalBridgeHash,
    canonicalBridgeHash,
  });
}

export const GovernanceAwareCautionBridge = buildGovernanceAwareCautionBridge;
