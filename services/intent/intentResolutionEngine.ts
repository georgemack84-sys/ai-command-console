import { INTENT_ERROR_CODES, type StructuredIntent } from "@/types/intentContracts";
import type { IntentValidationResult } from "@/types/intentValidation";
import type { OperationalIntentResolutionResult } from "@/types/operationalIntent";
import { IntentResolutionState } from "@/types/contextualResolution";
import { freezeIntent } from "./intentFreeze";
import { appendIntentAudit } from "./intentAuditAppender";
import { verifyIntentReplayIntegrity } from "./intentReplayInspector";
import { applyContextualIntentResolution } from "./contextualIntentResolver";
import { resolveSemanticIntent } from "./semanticResolver";
import { validateCanonicalizedIntent } from "./intentValidator";
import { readIntent } from "./intentPersistence";
import { transitionIntentLifecycle } from "./intentLifecycleManager";
import { resolveIntentAmbiguity } from "./ambiguityResolutionEngine";
import { orchestrateIntentClarification } from "./intentClarificationOrchestrator";
import { normalizeOperationalIntent } from "./intentNormalizationEngine";
import { finalizeOperationalIntent } from "./operationalIntentFinalizer";
import { appendOperationalIntentAudit } from "./operationalIntentAudit";
import { resolvePlannerAdmission } from "./plannerAdmissionResolver";
import { OPERATIONAL_INTENT_RESOLUTION_VERSION } from "@/types/operationalIntent";
import { evaluateSemanticGovernance } from "@/services/governance/semanticGovernanceEngine";
import { resolveToolCapability } from "@/services/registry/toolCapabilityResolver";

export function resolveOperationalIntentForPlanning(structuredIntent: StructuredIntent): OperationalIntentResolutionResult {
  const canonical = applyContextualIntentResolution({
    intent: structuredIntent,
    canonicalIntent: resolveSemanticIntent(structuredIntent),
  });
  const validation = validateCanonicalizedIntent({
    structuredIntent,
    canonicalIntent: canonical,
  });
  const registryMatch = resolveToolCapability(validation.canonicalIntent.action);
  const ambiguity = resolveIntentAmbiguity({
    structuredIntent,
    canonicalIntent: validation.canonicalIntent,
  });

  const persistedIntent = readIntent(structuredIntent.intentId);
  const replay = persistedIntent ? verifyIntentReplayIntegrity(structuredIntent.intentId) : { driftDetected: false, reasons: [] as string[] };
  const frozen = persistedIntent?.lifecycleState === "FROZEN";
  const semanticGovernance = evaluateSemanticGovernance({
    canonicalIntent: validation.canonicalIntent,
    registryEntry: registryMatch.entry,
    frozen: Boolean(frozen),
    replayDrift: replay.driftDetected,
    plannerEligibilityPreconditions: {
      capabilityMatch: registryMatch.capabilityMatch,
      plannerEligible: Boolean(registryMatch.entry?.plannerEligible),
    },
    resolutionSignals: {
      contextualConflict: ambiguity.conflictingContext.length > 0,
      unsafeAssumption: ambiguity.unsafeAssumptions.length > 0,
    },
  });
  const clarification = orchestrateIntentClarification({
    missingContext: ambiguity.missingContext,
    conflictingContext: ambiguity.conflictingContext,
    unsafeAssumptions: ambiguity.unsafeAssumptions,
    ambiguityDetected: ambiguity.ambiguityDetected,
    protectedTargetDetected: semanticGovernance.protectedTargetDetected,
  });
  const normalizedIntent = normalizeOperationalIntent(validation.canonicalIntent);
  const plannerAdmission = resolvePlannerAdmission({
    semanticValid: semanticGovernance.semanticValid,
    governanceApproved: semanticGovernance.governanceApproved,
    ambiguityDetected: semanticGovernance.ambiguityDetected || ambiguity.ambiguityDetected,
    clarificationRequired: clarification.clarificationRequired,
    protectedTargetDetected: semanticGovernance.protectedTargetDetected,
    replayDriftDetected: replay.driftDetected,
    freezeActive: semanticGovernance.freezeActive,
    capabilityMatch: registryMatch.capabilityMatch,
    plannerEligible: semanticGovernance.plannerAdmissible,
    semanticConflicts: semanticGovernance.semanticConflicts,
    contextSufficient: ambiguity.contextSufficient,
    conflictingContext: ambiguity.conflictingContext,
    unsafeAssumptions: ambiguity.unsafeAssumptions,
  });
  const finalization = finalizeOperationalIntent({
    intentId: structuredIntent.intentId,
    originalInput: structuredIntent.rawInput,
    normalizedIntent,
    plannerAdmissible: plannerAdmission.admissible && !clarification.clarificationRequired,
    createdAt: structuredIntent.createdAt,
  });

  if (ambiguity.contextSufficient) {
    appendOperationalIntentAudit({
      intentId: structuredIntent.intentId,
      eventType: "INTENT_CONTEXT_RESOLVED",
      details: { normalizedIntent },
    });
  } else {
    appendOperationalIntentAudit({
      intentId: structuredIntent.intentId,
      eventType: "INTENT_CONTEXT_INSUFFICIENT",
      details: { missingContext: ambiguity.missingContext },
    });
  }
  appendOperationalIntentAudit({
    intentId: structuredIntent.intentId,
    eventType: "INTENT_NORMALIZED",
    details: { normalizedIntent },
  });
  if (clarification.clarificationRequired) {
    appendOperationalIntentAudit({
      intentId: structuredIntent.intentId,
      eventType: ambiguity.unsafeAssumptions.length > 0 || ambiguity.conflictingContext.length > 0
        ? "INTENT_AMBIGUITY_ESCALATED"
        : "INTENT_CLARIFICATION_GENERATED",
      details: clarification,
    });
  }
  if (ambiguity.unsafeAssumptions.length > 0) {
    appendOperationalIntentAudit({
      intentId: structuredIntent.intentId,
      eventType: "INTENT_UNSAFE_ASSUMPTION_BLOCKED",
      details: { unsafeAssumptions: ambiguity.unsafeAssumptions },
    });
  }
  if (!plannerAdmission.admissible) {
    appendOperationalIntentAudit({
      intentId: structuredIntent.intentId,
      eventType: "INTENT_PLANNER_ADMISSION_DENIED",
      details: plannerAdmission,
    });
  }
  if (finalization.finalized) {
    appendOperationalIntentAudit({
      intentId: structuredIntent.intentId,
      eventType: "INTENT_FINALIZED",
      details: finalization,
    });
  }

  if (persistedIntent) {
    if (replay.driftDetected) {
      if (persistedIntent.lifecycleState !== "FROZEN") {
        try {
          transitionIntentLifecycle({
            intentId: structuredIntent.intentId,
            fromState: persistedIntent.lifecycleState,
            toState: "FROZEN",
            actor: "operator",
            reason: replay.reasons.join(","),
            timestamp: persistedIntent.createdAt + 100,
          });
        } catch {
          freezeIntent(structuredIntent.intentId, replay.reasons.join(","));
        }
      } else {
        freezeIntent(structuredIntent.intentId, replay.reasons.join(","));
      }
      appendIntentAudit({
        intentId: structuredIntent.intentId,
        eventType: "intent.resolution_rejected",
        details: {
          reason: INTENT_ERROR_CODES.INTENT_REPLAY_MISMATCH,
          replayReasons: replay.reasons,
        },
      });

      return {
        intentId: structuredIntent.intentId,
        originalInput: structuredIntent.rawInput,
        parsedIntent: structuredIntent.intent,
        normalizedIntent,
        semanticGovernance: {
          semanticallyValid: false,
          ambiguityDetected: true,
          governanceApproved: false,
          protectedTargetDetected: semanticGovernance.protectedTargetDetected,
          replayDriftDetected: true,
          freezeActive: true,
        },
        contextualResolution: {
          contextSufficient: ambiguity.contextSufficient,
          missingContext: ambiguity.missingContext,
          conflictingContext: ambiguity.conflictingContext,
          unsafeAssumptions: ambiguity.unsafeAssumptions,
        },
        clarification: {
          ...clarification,
          clarificationRequired: true,
          blockingReasons: Array.from(new Set([...clarification.blockingReasons, ...replay.reasons])),
        },
        plannerAdmission: {
          admissible: false,
          denialReasons: Array.from(new Set([...plannerAdmission.denialReasons, ...replay.reasons])),
          escalationRequired: true,
        },
        finalization: {
          ...finalization,
          finalized: false,
        },
        lineage: {
          parserVersion: structuredIntent.parserVersion,
          semanticVersion: structuredIntent.taxonomyVersion,
          governanceVersion: "4.1D",
          resolutionVersion: OPERATIONAL_INTENT_RESOLUTION_VERSION,
        },
        resolutionState: IntentResolutionState.REPLAY_BLOCKED,
      };
    }
  }

  return {
    intentId: structuredIntent.intentId,
    originalInput: structuredIntent.rawInput,
    parsedIntent: structuredIntent.intent,
    normalizedIntent,
    semanticGovernance: {
      semanticallyValid: semanticGovernance.semanticValid,
      ambiguityDetected: semanticGovernance.ambiguityDetected || ambiguity.ambiguityDetected,
      governanceApproved: semanticGovernance.governanceApproved,
      protectedTargetDetected: semanticGovernance.protectedTargetDetected,
      replayDriftDetected: replay.driftDetected,
      freezeActive: semanticGovernance.freezeActive,
    },
    contextualResolution: {
      contextSufficient: ambiguity.contextSufficient,
      missingContext: ambiguity.missingContext,
      conflictingContext: ambiguity.conflictingContext,
      unsafeAssumptions: ambiguity.unsafeAssumptions,
    },
    clarification,
    plannerAdmission,
    finalization,
    lineage: {
      parserVersion: structuredIntent.parserVersion,
      semanticVersion: structuredIntent.taxonomyVersion,
      governanceVersion: "4.1D",
      resolutionVersion: OPERATIONAL_INTENT_RESOLUTION_VERSION,
    },
    resolutionState: plannerAdmission.state,
  };
}

export function resolveIntentForPlanning(structuredIntent: StructuredIntent): IntentValidationResult {
  const canonical = applyContextualIntentResolution({
    intent: structuredIntent,
    canonicalIntent: resolveSemanticIntent(structuredIntent),
  });
  const validation = validateCanonicalizedIntent({
    structuredIntent,
    canonicalIntent: canonical,
  });
  const operational = resolveOperationalIntentForPlanning(structuredIntent);

  appendIntentAudit({
    intentId: structuredIntent.intentId,
    eventType: "intent.resolution_completed",
    details: {
      action: validation.canonicalIntent.action,
      target: validation.canonicalIntent.target,
      blockedReasons: Array.from(new Set([
        ...validation.blockedReasons,
        ...operational.clarification.blockingReasons,
        ...operational.plannerAdmission.denialReasons,
      ])),
      clarificationRequired: validation.clarificationRequired || operational.clarification.clarificationRequired,
    },
  });

  return {
    ...validation,
    valid: validation.valid && operational.plannerAdmission.admissible && !operational.clarification.clarificationRequired,
    clarificationRequired: validation.clarificationRequired || operational.clarification.clarificationRequired,
    blockedReasons: Array.from(new Set([
      ...validation.blockedReasons,
      ...operational.clarification.blockingReasons,
      ...operational.plannerAdmission.denialReasons,
    ])),
    canonicalIntent: {
      ...validation.canonicalIntent,
      action: operational.normalizedIntent.action,
      target: operational.normalizedIntent.target,
      parameters: operational.normalizedIntent.parameters,
      warnings: Array.from(new Set([
        ...validation.canonicalIntent.warnings,
        ...operational.clarification.generatedQuestions.map((question) => `CLARIFICATION:${question}`),
      ])),
    },
  };
}
