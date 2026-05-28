import { hashEvidence } from "@/services/audit/evidenceHashing";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";
import { resolveOperationalIntentForPlanning } from "@/services/intent/intentResolutionEngine";
import type { StructuredIntent } from "@/types/intentContracts";
import type { GovernedIntent } from "@/types/governedIntent";
import { classifyIntentGovernanceRisk } from "./intentRiskClassifier";
import { enforceIntentBoundary } from "./intentBoundaryEnforcer";
import { resolveGovernanceConflicts } from "./governanceConflictResolver";
import { validateProtectedTargets } from "./protectedTargetValidator";
import { validateReplayGovernance } from "./replayGovernanceValidator";
import { validateFreezeGovernance } from "./freezeGovernanceValidator";
import { validateSemanticIntentRuntime } from "./semanticIntentValidator";
import { PLANNER_ADMISSION_POLICY_VERSION, PLANNER_ADMISSION_VALIDATOR_VERSION } from "./plannerAdmissionPolicies";

export function resolveGovernedIntent(structuredIntent: StructuredIntent): GovernedIntent {
  const operational = resolveOperationalIntentForPlanning(structuredIntent);
  const plannerValidation = validateIntentForPlanning(structuredIntent);
  const semantic = validateSemanticIntentRuntime(operational);
  const replay = validateReplayGovernance(operational);
  const freeze = validateFreezeGovernance(operational);
  const protectedTarget = validateProtectedTargets(operational);
  const boundary = enforceIntentBoundary(operational);
  const approvalRequired = plannerValidation.governance.approvalRequired;
  const unsafeAssumptionsDetected = operational.contextualResolution.unsafeAssumptions.length > 0;
  const ambiguityResolved = !operational.semanticGovernance.ambiguityDetected && !operational.clarification.clarificationRequired;
  const containmentRequired = !replay.replaySafe || !freeze.freezeSafe || !protectedTarget.protectedTargetValidated;
  const blockedReasons = Array.from(new Set([
    ...semantic.blockedReasons,
    ...replay.blockedReasons,
    ...freeze.blockedReasons,
    ...protectedTarget.blockedReasons,
    ...boundary.blockedReasons,
    ...plannerValidation.blockedReasons,
  ]));
  const governanceResolution = resolveGovernanceConflicts({
    replaySafe: replay.replaySafe,
    freezeSafe: freeze.freezeSafe,
    semanticValid: semantic.semanticValid,
    governanceApproved: plannerValidation.governance.blocked === false,
    ambiguityResolved,
    protectedTargetValidated: protectedTarget.protectedTargetValidated,
    unsafeAssumptionsDetected,
    approvalRequired,
    containmentRequired,
    blockedReasons,
  });
  const allowedTools = plannerValidation.registry.matchedTool && governanceResolution.governanceState === "VALID"
    ? [plannerValidation.registry.matchedTool]
    : [];
  const deniedTools = plannerValidation.registry.matchedTool && governanceResolution.governanceState !== "VALID"
    ? [plannerValidation.registry.matchedTool]
    : [];

  return {
    governedIntentId: `governed-intent:${hashEvidence({
      intentId: structuredIntent.intentId,
      plannerValidation: plannerValidation.auditId,
      resolutionHash: operational.finalization.operationalIntentHash,
    }).slice(0, 16)}`,
    semanticValid: semantic.semanticValid,
    governanceApproved: plannerValidation.governance.blocked === false,
    plannerEligible: plannerValidation.plannerEligible && operational.plannerAdmission.admissible,
    replaySafe: replay.replaySafe,
    freezeSafe: freeze.freezeSafe,
    ambiguityResolved,
    protectedTargetValidated: protectedTarget.protectedTargetValidated,
    unsafeAssumptionsDetected,
    escalationRequired: operational.plannerAdmission.escalationRequired,
    clarificationRequired: operational.clarification.clarificationRequired,
    approvalRequired,
    containmentRequired,
    governanceState: governanceResolution.governanceState as GovernedIntent["governanceState"],
    riskLevel: classifyIntentGovernanceRisk(operational),
    blockedReasons: governanceResolution.blockedReasons,
    warnings: Array.from(new Set([
      ...plannerValidation.warnings,
      ...operational.clarification.generatedQuestions.map((question) => `CLARIFICATION:${question}`),
    ])),
    governanceActions: governanceResolution.governanceActions,
    escalationTargets: governanceResolution.escalationTargets,
    allowedTools,
    deniedTools,
    audit: {
      validatedAt: structuredIntent.createdAt,
      policyVersion: PLANNER_ADMISSION_POLICY_VERSION,
      validatorVersion: PLANNER_ADMISSION_VALIDATOR_VERSION,
    },
  };
}
