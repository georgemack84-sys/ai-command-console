import type { StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntent } from "@/types/semanticResolution";
import { PATH_PATTERN, PORT_PATTERN } from "./semanticPatterns";
import { CONTEXTUAL_DEFAULTS, evaluateGovernanceRisk, SEMANTIC_ALIAS_RESOLUTION } from "./intentPolicies";

function resolveByAlias(input: string) {
  const lower = input.toLowerCase();
  const entry = Object.entries(SEMANTIC_ALIAS_RESOLUTION).find(([alias]) => lower.includes(alias));
  return entry?.[1];
}

function inferAction(intent: StructuredIntent) {
  if (intent.category === "filesystem" && intent.intent.action === "read") {
    return "filesystem.read.file";
  }
  if (intent.category === "filesystem" && intent.intent.action === "search") {
    return "filesystem.search";
  }
  if (intent.category === "runtime" && intent.intent.action === "inspect") {
    return "runtime.inspect";
  }
  if (intent.category === "governance" && intent.intent.action === "inspect") {
    return "governance.inspect";
  }
  if (intent.category === "recovery" && intent.intent.action === "inspect") {
    return "recovery.inspect";
  }
  if (intent.category === "diagnostics" && intent.intent.action === "inspect") {
    return "diagnostics.inspect";
  }
  return `${intent.category}.${intent.intent.action}`;
}

export function resolveSemanticIntent(intent: StructuredIntent): CanonicalIntent {
  const alias = resolveByAlias(intent.normalizedInput);
  const canonicalAction = alias?.action ?? inferAction(intent);
  const target =
    alias?.target
    ?? (typeof intent.intent.parameters.path === "string" ? String(intent.intent.parameters.path) : undefined)
    ?? (intent.intent.parameters.port ? `port:${intent.intent.parameters.port}` : undefined)
    ?? (intent.intent.target !== "unknown" ? intent.intent.target : undefined)
    ?? CONTEXTUAL_DEFAULTS[intent.category]
    ?? "unknown";

  const parameters = {
    ...intent.intent.parameters,
    ...(PATH_PATTERN.test(intent.normalizedInput) && !intent.intent.parameters.path ? { path: intent.normalizedInput.match(PATH_PATTERN)?.[0] } : {}),
    ...(PORT_PATTERN.test(intent.normalizedInput) && !intent.intent.parameters.port ? { port: Number(intent.normalizedInput.match(PORT_PATTERN)?.[1]) } : {}),
  };
  const resolvedAmbiguities = alias
    ? intent.ambiguities.filter((ambiguity) =>
        !["target_unresolved", "ai_target_unresolved", "action_unresolved", "ai_action_unresolved"].includes(ambiguity))
    : [...intent.ambiguities];
  const clarificationRequired = alias ? resolvedAmbiguities.length > 0 : intent.clarificationRequired;

  return {
    intentId: intent.intentId,
    action: canonicalAction,
    target,
    parameters,
    semanticMeaning: alias?.semanticMeaning ?? `${canonicalAction} against ${target}`,
    confidence: intent.confidence,
    source: intent.source,
    ambiguities: resolvedAmbiguities,
    clarificationRequired,
    governanceRisk: alias?.governanceRisk ?? evaluateGovernanceRisk(intent, canonicalAction),
    supported: intent.supported,
    normalized: true,
    validation: {
      schemaValid: true,
      semanticValid: true,
      governanceValid: true,
      toolCompatible: true,
    },
    warnings: [...intent.warnings],
    createdAt: intent.createdAt,
  };
}
