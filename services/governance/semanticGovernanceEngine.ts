import { hashEvidence } from "@/services/audit/evidenceHashing";
import type { ToolRegistryEntry } from "@/services/registry/toolRegistry";
import type { CanonicalIntent } from "@/types/semanticResolution";
import type { SemanticGovernanceResult } from "@/types/intentValidation";
import { analyzeSemanticAmbiguity } from "@/services/intent/semanticAmbiguityAnalyzer";
import { resolveClarificationRequirement } from "@/services/intent/clarificationRequirementResolver";
import { detectIntentContradictions } from "@/services/intent/intentContradictionDetector";
import { evaluatePlannerAdmissionFirewall } from "@/services/intent/plannerAdmissionFirewall";
import { evaluateProtectedTargetIsolation } from "@/services/intent/protectedTargetIsolation";
import { validateSemanticMeaning } from "@/services/intent/semanticMeaningValidator";
import { resolveSemanticConflicts } from "@/services/intent/semanticConflictResolver";
import { mapSemanticRiskLevel } from "./semanticGovernancePolicies";
import { routeSemanticGovernanceEscalation } from "./governanceEscalationRouter";
import { validateIntentGovernance } from "./intentGovernanceValidator";

export function evaluateSemanticGovernance(input: {
  canonicalIntent: CanonicalIntent;
  registryEntry: ToolRegistryEntry | null;
  frozen: boolean;
  replayDrift: boolean;
  plannerEligibilityPreconditions: {
    capabilityMatch: boolean;
    plannerEligible: boolean;
  };
  resolutionSignals?: {
    contextualConflict?: boolean;
    unsafeAssumption?: boolean;
  };
}): SemanticGovernanceResult {
  const semanticMeaning = validateSemanticMeaning({
    canonicalIntent: input.canonicalIntent,
    registryEntry: input.registryEntry,
  });
  const contradictions = detectIntentContradictions(input.canonicalIntent);
  const ambiguity = analyzeSemanticAmbiguity(input.canonicalIntent);
  const conflicts = resolveSemanticConflicts({
    contradictions: contradictions.conflicts,
    ambiguityReasons: ambiguity.reasons,
    unsupported: !input.canonicalIntent.supported,
  });
  const protectedTarget = evaluateProtectedTargetIsolation({
    canonicalIntent: input.canonicalIntent,
    registryEntry: input.registryEntry,
  });
  const governance = validateIntentGovernance({
    canonicalIntent: input.canonicalIntent,
    registryEntry: input.registryEntry,
    frozen: input.frozen,
    replayDrift: input.replayDrift,
  });
  const clarificationRequired = resolveClarificationRequirement({
    ambiguityDetected: ambiguity.ambiguityDetected,
    confidence: input.canonicalIntent.confidence,
    semanticConflicts: conflicts.semanticConflicts,
    protectedTargetDetected: protectedTarget.protectedTargetDetected,
  });

  const firewall = evaluatePlannerAdmissionFirewall({
    semanticValid:
      semanticMeaning.semanticValid
      && contradictions.valid
      && !conflicts.blocked
      && !input.resolutionSignals?.contextualConflict
      && !input.resolutionSignals?.unsafeAssumption,
    governanceApproved: !governance.blocked,
    ambiguityDetected: ambiguity.ambiguityDetected,
    clarificationRequired,
    protectedTargetDetected: protectedTarget.protectedTargetDetected,
    replayDriftDetected: input.replayDrift,
    freezeActive: input.frozen || governance.freezeReasons.length > 0,
    capabilityMatch: input.plannerEligibilityPreconditions.capabilityMatch,
    plannerEligible: input.plannerEligibilityPreconditions.plannerEligible,
    semanticConflicts: conflicts.semanticConflicts,
  });

  const riskLevel = mapSemanticRiskLevel({
    protectedTargetDetected: protectedTarget.protectedTargetDetected,
    governanceBlocked: governance.blocked || Boolean(input.resolutionSignals?.unsafeAssumption),
    semanticConflicts: conflicts.semanticConflicts,
    ambiguityDetected: ambiguity.ambiguityDetected,
    approvalRequired: governance.approvalRequired,
  });

  const nextState = routeSemanticGovernanceEscalation({
    freezeActive: input.frozen || governance.freezeReasons.length > 0,
    plannerAdmissible: firewall.plannerAdmissible,
    clarificationRequired,
    escalationRequired: protectedTarget.escalationRequired || governance.risk === "restricted",
    approvalRequired: governance.approvalRequired,
  });

  return {
    valid: firewall.plannerAdmissible && semanticMeaning.semanticValid,
    semanticValid: semanticMeaning.semanticValid && contradictions.valid && !conflicts.blocked,
    governanceApproved: !governance.blocked,
    plannerAdmissible: firewall.plannerAdmissible,
    ambiguityDetected: ambiguity.ambiguityDetected,
    escalationRequired: protectedTarget.escalationRequired || governance.risk === "restricted",
    clarificationRequired,
    protectedTargetDetected: protectedTarget.protectedTargetDetected,
    replayDriftDetected: input.replayDrift,
    freezeActive: input.frozen || governance.freezeReasons.length > 0,
    riskLevel,
    violations: Array.from(new Set([
      ...semanticMeaning.violations,
      ...conflicts.semanticConflicts,
      ...protectedTarget.reasons,
      ...firewall.plannerBlockReasons,
    ])),
    warnings: Array.from(new Set([
      ...semanticMeaning.warnings,
      ...(governance.approvalRequired ? ["APPROVAL_REQUIRED"] : []),
    ])),
    semanticConflicts: conflicts.semanticConflicts,
    governanceReasons: Array.from(new Set([...governance.reasons, ...governance.freezeReasons])),
    plannerBlockReasons: firewall.plannerBlockReasons,
    nextState,
    auditId: `semantic-governance:${hashEvidence({
      intentId: input.canonicalIntent.intentId,
      action: input.canonicalIntent.action,
      target: input.canonicalIntent.target,
      nextState,
      riskLevel,
    }).slice(0, 16)}`,
  };
}
