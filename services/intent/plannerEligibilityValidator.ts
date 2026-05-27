import { validateContractPayload } from "@/services/contracts/validateContract";
import { plannerEligibilitySchema } from "@/schemas/plannerEligibilitySchema";
import { appendIntentValidationAudit } from "@/services/audit/intentValidationAudit";
import { recordIntentValidationMetric } from "@/services/telemetry/intentValidationTelemetry";
import type { StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntentValidationResult } from "@/types/intentValidation";
import { resolveToolCapability } from "@/services/registry/toolCapabilityResolver";
import { validateRegistryEntry } from "@/services/registry/registryValidator";
import { validateCanonicalIntentShape } from "./canonicalIntentValidator";
import { validateIntentParameters } from "./parameterSafetyValidator";
import { validateIntentTargetBoundary } from "./targetBoundaryValidator";
import { validateIntentGovernance } from "@/services/governance/intentGovernanceValidator";
import { evaluateSemanticGovernance } from "@/services/governance/semanticGovernanceEngine";
import { resolveIntentForPlanning, resolveOperationalIntentForPlanning } from "./intentResolutionEngine";
import { readIntent } from "./intentPersistence";
import { isIntentFrozen } from "./intentFreeze";
import { verifyIntentReplayIntegrity } from "./intentReplayInspector";

export function validateIntentForPlanning(structuredIntent: StructuredIntent): CanonicalIntentValidationResult {
  recordIntentValidationMetric("intent_validation_total");
  appendIntentValidationAudit({
    intentId: structuredIntent.intentId,
    eventType: "intent.validation.started",
    details: {
      rawAction: structuredIntent.intent.action,
      category: structuredIntent.category,
    },
  });

  const semantic = resolveIntentForPlanning(structuredIntent);
  const operational = resolveOperationalIntentForPlanning(structuredIntent);
  const canonicalIntent = semantic.canonicalIntent;
  const shape = validateCanonicalIntentShape(canonicalIntent);
  const registryMatch = resolveToolCapability(canonicalIntent.action);
  const registryValid = registryMatch.entry ? validateRegistryEntry(registryMatch.entry) : { valid: false, reasons: ["UNKNOWN_TOOL"] };
  const replay = readIntent(structuredIntent.intentId) ? verifyIntentReplayIntegrity(structuredIntent.intentId) : { driftDetected: false, reasons: [] as string[] };
  const frozen = readIntent(structuredIntent.intentId) ? isIntentFrozen(structuredIntent.intentId) : structuredIntent.lifecycleState === "FROZEN";
  const governance = validateIntentGovernance({
    canonicalIntent,
    registryEntry: registryMatch.entry,
    frozen,
    replayDrift: replay.driftDetected,
  });
  const parameterSafety = validateIntentParameters({
    canonicalIntent,
    registryEntry: registryMatch.entry,
  });
  const targetAllowed = validateIntentTargetBoundary({
    canonicalIntent,
    registryEntry: registryMatch.entry,
  });
  const semanticGovernance = evaluateSemanticGovernance({
    canonicalIntent,
    registryEntry: registryMatch.entry,
    frozen,
    replayDrift: replay.driftDetected,
    plannerEligibilityPreconditions: {
      capabilityMatch: registryMatch.capabilityMatch,
      plannerEligible: Boolean(registryMatch.entry?.plannerEligible),
    },
  });

  const blockedReasons = Array.from(new Set([
    ...semantic.blockedReasons,
    ...operational.clarification.blockingReasons,
    ...operational.plannerAdmission.denialReasons,
    ...semanticGovernance.violations,
    ...semanticGovernance.plannerBlockReasons,
    ...shape.reasons,
    ...registryValid.reasons,
    ...(registryMatch.capabilityMatch ? [] : ["CAPABILITY_MISMATCH"]),
    ...(registryMatch.entry?.enabled === false ? ["DISABLED_TOOL"] : []),
    ...(registryMatch.entry?.plannerEligible === false ? ["PLANNER_INELIGIBLE"] : []),
    ...governance.reasons,
    ...parameterSafety.blockedReasons,
    ...targetAllowed.blockedReasons,
  ]));

  if (!registryMatch.capabilityMatch) {
    recordIntentValidationMetric("unknown_tool_attempts");
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: "intent.registry.denied",
      details: { action: canonicalIntent.action, reasons: blockedReasons },
    });
  } else {
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: "intent.registry.matched",
      details: { toolId: registryMatch.entry?.toolId ?? null, action: canonicalIntent.action },
    });
  }

  if (governance.blocked) {
    recordIntentValidationMetric("governance_denials");
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: frozen ? "intent.freeze.blocked" : "intent.governance.denied",
      details: { risk: governance.risk, reasons: governance.reasons },
    });
  }

  if (!semanticGovernance.semanticValid || !semanticGovernance.governanceApproved) {
    recordIntentValidationMetric("semantic_denials");
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: semanticGovernance.semanticConflicts.length > 0 ? "intent.semantic.conflict" : "intent.semantic.denied",
      details: {
        violations: semanticGovernance.violations,
        semanticConflicts: semanticGovernance.semanticConflicts,
        governanceReasons: semanticGovernance.governanceReasons,
      },
    });
  }

  if (semanticGovernance.ambiguityDetected || semanticGovernance.clarificationRequired) {
    recordIntentValidationMetric("ambiguity_escalations");
    recordIntentValidationMetric("ambiguityDetectionRate");
    recordIntentValidationMetric("clarificationGenerationRate");
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: "intent.semantic.ambiguity",
      details: {
        ambiguities: canonicalIntent.ambiguities,
        warnings: semanticGovernance.warnings,
      },
    });
  }

  if (semanticGovernance.protectedTargetDetected) {
    recordIntentValidationMetric("protected_target_requests");
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: "intent.semantic.protected_target",
      details: {
        target: canonicalIntent.target,
        plannerBlockReasons: semanticGovernance.plannerBlockReasons,
      },
    });
  }

  if (!parameterSafety.valid) {
    recordIntentValidationMetric("unsafe_parameter_blocks");
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: "intent.parameters.blocked",
      details: { reasons: parameterSafety.blockedReasons },
    });
  }

  if (replay.driftDetected) {
    recordIntentValidationMetric("replay_drift_blocks");
    recordIntentValidationMetric("semantic_drift_incidents");
    recordIntentValidationMetric("replayResolutionBlocks");
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: "intent.replay.drift_detected",
      details: { reasons: replay.reasons },
    });
  }

  if (governance.approvalRequired) {
    recordIntentValidationMetric("approval_required_total");
  }
  if (semanticGovernance.escalationRequired) {
    recordIntentValidationMetric("governance_escalations");
    appendIntentValidationAudit({
      intentId: structuredIntent.intentId,
      eventType: "intent.semantic.escalated",
      details: {
        nextState: semanticGovernance.nextState,
        governanceReasons: semanticGovernance.governanceReasons,
      },
    });
  }
  if (semanticGovernance.semanticConflicts.length > 0) {
    recordIntentValidationMetric("semantic_conflicts");
  }
  if (!operational.contextualResolution.contextSufficient) {
    recordIntentValidationMetric("contextualResolutionRate");
  }
  if (operational.contextualResolution.unsafeAssumptions.length > 0) {
    recordIntentValidationMetric("unsafeAssumptionBlockRate");
  }
  if (semanticGovernance.freezeActive) {
    recordIntentValidationMetric("freezeResolutionBlocks");
  }
  recordIntentValidationMetric("normalizationFrequency");

  const valid = blockedReasons.length === 0;
  const plannerEligible =
    valid
    && semantic.valid
    && semanticGovernance.valid
    && semanticGovernance.plannerAdmissible
    && shape.valid
    && registryValid.valid
    && registryMatch.capabilityMatch
    && Boolean(registryMatch.entry?.enabled)
    && Boolean(registryMatch.entry?.plannerEligible)
    && !governance.blocked
    && parameterSafety.valid
    && targetAllowed.valid;

  if (!plannerEligible) {
    recordIntentValidationMetric("planner_eligibility_failures");
    recordIntentValidationMetric("plannerAdmissionDenialRate");
  }
  if (!operational.plannerAdmission.admissible) {
    recordIntentValidationMetric("planner_firewall_denials");
  }

  const result: CanonicalIntentValidationResult = {
    valid,
    canonicalIntent: canonicalIntent ? {
      action: canonicalIntent.action,
      target: canonicalIntent.target,
      parameters: canonicalIntent.parameters,
    } : null,
    plannerEligible,
    validation: {
      registryValid: registryValid.valid,
      capabilityValid: registryMatch.capabilityMatch,
      governanceValid: !governance.blocked,
      parameterSafe: parameterSafety.valid,
      targetAllowed: targetAllowed.valid,
    },
    governance: {
      risk: governance.risk,
      approvalRequired: governance.approvalRequired,
      blocked: governance.blocked,
    },
    registry: {
      matchedTool: registryMatch.entry?.toolId ?? null,
      toolEnabled: Boolean(registryMatch.entry?.enabled),
      plannerEligible: Boolean(registryMatch.entry?.plannerEligible),
      capabilityMatch: registryMatch.capabilityMatch,
    },
    blockedReasons,
    warnings: Array.from(new Set([
      ...semantic.warnings,
      ...semanticGovernance.warnings,
      ...(governance.approvalRequired ? ["APPROVAL_REQUIRED"] : []),
    ])),
    semanticGovernance,
    auditId: `intent-validation:${structuredIntent.intentId}:${structuredIntent.createdAt}`,
    timestamp: structuredIntent.createdAt,
  };

  const contract = validateContractPayload<CanonicalIntentValidationResult>({
    schema: plannerEligibilitySchema,
    payload: result,
  });
  const finalResult = contract.ok
    ? result
    : {
        ...result,
        valid: false,
        plannerEligible: false,
        blockedReasons: Array.from(new Set([...result.blockedReasons, "VALIDATION_FAILED"])),
      };

  appendIntentValidationAudit({
    intentId: structuredIntent.intentId,
    eventType: finalResult.plannerEligible ? "intent.planner.eligible" : "intent.planner.denied",
    details: {
      plannerEligible: finalResult.plannerEligible,
      blockedReasons: finalResult.blockedReasons,
      semanticGovernance: finalResult.semanticGovernance,
    },
  });
  appendIntentValidationAudit({
    intentId: structuredIntent.intentId,
    eventType: finalResult.valid && finalResult.plannerEligible ? "intent.validation.succeeded" : "intent.validation.failed",
    details: {
      valid: finalResult.valid,
      plannerEligible: finalResult.plannerEligible,
      blockedReasons: finalResult.blockedReasons,
    },
  });

  return finalResult;
}
