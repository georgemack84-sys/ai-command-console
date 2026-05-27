import type { ParserCandidate } from "@/types/intentContracts";
import { DANGEROUS_PATTERNS, PATH_PATTERN, PORT_PATTERN } from "./semanticPatterns";
import { inferOperationalCategory } from "./semanticClassifier";

function inferAction(input: string) {
  const lower = input.toLowerCase();
  if (/\bwhat('?s| is) going on\b|\bwhy\b/.test(lower)) {
    return "inspect";
  }
  if (/\btake a look\b|\breview\b/.test(lower)) {
    return "inspect";
  }
  if (/\bbring back\b|\brestore\b|\brecover\b/.test(lower)) {
    return "recover";
  }
  if (/\bconfirm\b|\bdouble check\b/.test(lower)) {
    return "validate";
  }
  return "unknown";
}

function inferTarget(input: string) {
  const lower = input.toLowerCase();
  if (PATH_PATTERN.test(lower) || /\blogs?\b/.test(lower)) {
    return "filesystem";
  }
  if (PORT_PATTERN.test(lower) || /\bnetwork\b|\bendpoint\b/.test(lower)) {
    return "network";
  }
  if (/\bruntime\b|\bservice\b|\bprocess\b/.test(lower)) {
    return "runtime";
  }
  if (/\bgovernance\b|\bapproval\b|\bfreeze\b/.test(lower)) {
    return "governance";
  }
  if (/\brecovery\b|\breplay\b|\brestore\b/.test(lower)) {
    return "recovery";
  }
  return "unknown";
}

export function parseIntentWithAssistance(normalizedInput: string): ParserCandidate {
  const dangerous = DANGEROUS_PATTERNS.some((pattern) => pattern.test(normalizedInput));
  const action = inferAction(normalizedInput);
  const target = inferTarget(normalizedInput);
  const category = inferOperationalCategory(normalizedInput);

  return {
    operationalIntent: normalizedInput,
    category,
    intent: {
      action: action === "unknown" ? "clarify" : action,
      target,
      parameters: {
        path: normalizedInput.match(PATH_PATTERN)?.[0],
        port: normalizedInput.match(PORT_PATTERN)?.[1] ? Number(normalizedInput.match(PORT_PATTERN)?.[1]) : undefined,
      },
    },
    confidence: action !== "unknown" && target !== "unknown" && !dangerous ? 0.81 : 0.49,
    source: "ai",
    ambiguities: [
      ...(action === "unknown" ? ["ai_action_unresolved"] : []),
      ...(target === "unknown" ? ["ai_target_unresolved"] : []),
    ],
    clarificationRequired: action === "unknown" || target === "unknown" || dangerous,
    warnings: dangerous ? ["ai_output_blocked_by_semantic_policy"] : [],
    supported: action !== "unknown" && target !== "unknown" && !dangerous,
    dangerous,
    semanticWarnings: dangerous ? ["ai_output_blocked_by_semantic_policy"] : [],
  };
}
