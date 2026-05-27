import type { StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntent } from "@/types/semanticResolution";
import { CONTEXTUAL_DEFAULTS, isContextualDefaultAllowed } from "./intentPolicies";
import { INTENT_ERROR_CODES } from "@/types/intentContracts";
import { detectUnsafeAssumptions } from "./unsafeAssumptionDetector";
import { detectContextualConflicts } from "./contextualConflictDetector";
import { resolveIntentContextRequirements } from "./intentContextRequirements";

export function applyContextualIntentResolution(input: {
  intent: StructuredIntent;
  canonicalIntent: CanonicalIntent;
}) {
  const next = {
    ...input.canonicalIntent,
    parameters: { ...input.canonicalIntent.parameters },
    warnings: [...input.canonicalIntent.warnings],
    ambiguities: [...input.canonicalIntent.ambiguities],
    validation: { ...input.canonicalIntent.validation },
  };

  if (next.target === "unknown") {
    const fallbackTarget = CONTEXTUAL_DEFAULTS[input.intent.category];
    if (fallbackTarget && isContextualDefaultAllowed({ category: input.intent.category, action: next.action })) {
      next.target = fallbackTarget;
      next.semanticMeaning = `${next.action} against ${next.target}`;
      next.ambiguities = next.ambiguities.filter((ambiguity) =>
        ambiguity !== "target_unresolved" && ambiguity !== "ai_target_unresolved");
      next.clarificationRequired = next.ambiguities.length > 0;
    } else {
      next.clarificationRequired = true;
      next.ambiguities.push(INTENT_ERROR_CODES.INTENT_CONTEXT_INSUFFICIENT);
    }
  }

  if (/production/i.test(input.intent.normalizedInput) && !/service|host|cluster/i.test(input.intent.normalizedInput)) {
    next.clarificationRequired = true;
    next.ambiguities.push("production_scope_ambiguous");
  }

  const contextRequirements = resolveIntentContextRequirements({
    structuredIntent: input.intent,
    canonicalIntent: next,
  });
  const conflicts = detectContextualConflicts({
    structuredIntent: input.intent,
    canonicalIntent: next,
  });
  const unsafe = detectUnsafeAssumptions({
    structuredIntent: input.intent,
    canonicalIntent: next,
  });

  if (contextRequirements.missingContext.length > 0) {
    next.clarificationRequired = true;
    next.ambiguities.push(...contextRequirements.missingContext.map((field) => `${INTENT_ERROR_CODES.INTENT_CONTEXT_INSUFFICIENT}:${field}`));
  }

  if (conflicts.conflictingContext.length > 0) {
    next.clarificationRequired = true;
    next.ambiguities.push(...conflicts.conflictingContext);
  }

  if (unsafe.unsafeAssumptions.length > 0) {
    next.clarificationRequired = true;
    next.ambiguities.push(...unsafe.unsafeAssumptions);
    next.governanceRisk = "blocked";
  }

  if (
    next.target !== "unknown"
    && !next.ambiguities.some((ambiguity) =>
      ambiguity === "target_unresolved"
      || ambiguity === "ai_target_unresolved"
      || ambiguity === "action_unresolved"
      || ambiguity === "ai_action_unresolved"
      || ambiguity === INTENT_ERROR_CODES.INTENT_CONTEXT_INSUFFICIENT
      || ambiguity.startsWith(`${INTENT_ERROR_CODES.INTENT_CONTEXT_INSUFFICIENT}:`)
      || ambiguity === "production_scope_ambiguous")
  ) {
    next.clarificationRequired = false;
  }

  return next;
}
