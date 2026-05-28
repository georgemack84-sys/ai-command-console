import { hashEvidence } from "@/services/audit/evidenceHashing";
import type { IntentParserResult, StructuredIntent } from "@/types/intentContracts";
import { INTENT_ERROR_CODES } from "@/types/intentContracts";
import { evaluateConstitutionalFreezePropagation } from "@/services/validation/constitutionalFreezePropagation";
import { parseIntentDeterministically } from "./deterministicParser";
import { parseIntentWithAssistance } from "./aiAssistedParser";
import { parseIntentFallback } from "./fallbackParser";
import { evaluateIntentConfidence } from "./confidenceEvaluator";
import { validateStructuredIntentContract, validateIntentParserResult } from "./parserContractValidator";
import { normalizeIntentPayload } from "./intentNormalizer";
import { INTENT_PARSER_VERSION, INTENT_SCHEMA_VERSION, INTENT_TAXONOMY_VERSION } from "./normalizationPolicies";
import { validateTaxonomy } from "./intentTaxonomy";

function chooseCandidate(normalizedInput: string) {
  const deterministic = parseIntentDeterministically(normalizedInput);
  if (deterministic.dangerous) {
    return deterministic;
  }
  if (deterministic.confidence >= 0.85 && deterministic.ambiguities.length === 0 && deterministic.supported && !deterministic.dangerous) {
    return deterministic;
  }

  const aiCandidate = parseIntentWithAssistance(normalizedInput);
  if (aiCandidate.dangerous) {
    return aiCandidate;
  }
  if (aiCandidate.confidence >= 0.78 && aiCandidate.supported && !aiCandidate.dangerous) {
    return aiCandidate;
  }

  return parseIntentFallback(normalizedInput);
}

function lifecycleFromCandidate(input: {
  dangerous: boolean;
  ambiguities: string[];
  clarificationRequired: boolean;
  supported: boolean;
  confidenceAccepted: boolean;
}) {
  if (input.dangerous) {
    return "FROZEN" as const;
  }
  if (!input.supported) {
    return "REJECTED" as const;
  }
  if (input.ambiguities.length > 0 && input.clarificationRequired) {
    return input.ambiguities.includes("dangerous_scope_ambiguity") ? "FROZEN" as const : "CLARIFICATION_REQUIRED" as const;
  }
  if (!input.confidenceAccepted) {
    return "AMBIGUOUS" as const;
  }
  return "ACCEPTED" as const;
}

export function buildStructuredIntent(input: {
  intentId: string;
  rawInput: unknown;
  createdAt?: number;
}): StructuredIntent {
  const createdAt = input.createdAt ?? 0;
  const normalizedInput = normalizeIntentPayload(input.rawInput);
  const candidate = chooseCandidate(normalizedInput);
  const confidence = evaluateIntentConfidence({
    source: candidate.source,
    ambiguities: candidate.ambiguities,
    warnings: [...candidate.warnings, ...candidate.semanticWarnings],
    supported: candidate.supported,
    dangerous: candidate.dangerous,
  });

  const clarificationRequired = candidate.clarificationRequired || confidence.clarificationRequired;
  const supported = candidate.supported && validateTaxonomy(candidate.intent.action, candidate.category);
  const semanticWarnings = [
    ...candidate.semanticWarnings,
    ...(supported ? [] : [INTENT_ERROR_CODES.TAXONOMY_VALIDATION_FAILED]),
  ];
  const lifecycleState = lifecycleFromCandidate({
    dangerous: candidate.dangerous,
    ambiguities: candidate.ambiguities,
    clarificationRequired,
    supported,
    confidenceAccepted: confidence.accepted,
  });

  const lineageId = `intent-lineage:${hashEvidence({
    intentId: input.intentId,
    rawInput: normalizedInput,
    createdAt,
  }).slice(0, 16)}`;
  const replayHash = hashEvidence({
    normalizedInput,
    category: candidate.category,
    intent: candidate.intent,
    source: candidate.source,
  });
  const immutableHash = hashEvidence({
    normalizedInput,
    operationalIntent: candidate.operationalIntent,
    category: candidate.category,
    intent: candidate.intent,
    confidence: confidence.confidence,
    ambiguities: candidate.ambiguities,
    warnings: candidate.warnings,
    semanticWarnings,
  });

  const parserResult: IntentParserResult = {
    intent: candidate.intent,
    confidence: confidence.confidence,
    source: candidate.source,
    ambiguities: candidate.ambiguities,
    clarificationRequired,
    warnings: [...candidate.warnings, ...semanticWarnings],
    lifecycleState,
    replayHash,
    immutableHash,
    lineageId,
    semanticIntegrityVerified: true,
  };
  const parserValidation = validateIntentParserResult(parserResult);
  const freeze = evaluateConstitutionalFreezePropagation({
    governanceDecision: lifecycleState === "FROZEN" ? "FREEZE" : parserValidation.valid ? "ALLOW" : "BLOCKED",
    disputed: false,
    containmentActive: false,
    constitutionalConflict: candidate.dangerous || !parserValidation.valid,
    operatorSupremacyPreserved: true,
    immutableAuditIdPresent: true,
    driftDetected: false,
    versionConflict: false,
  });

  const structured: StructuredIntent = {
    intentId: input.intentId,
    rawInput: String(input.rawInput ?? ""),
    normalizedInput,
    operationalIntent: candidate.operationalIntent,
    category: candidate.category,
    intent: candidate.intent,
    confidence: confidence.confidence,
    source: candidate.source,
    ambiguities: candidate.ambiguities,
    clarificationRequired,
    warnings: [...candidate.warnings, ...semanticWarnings],
    supported,
    dangerous: candidate.dangerous,
    semanticWarnings,
    lifecycleState: freeze.frozen ? "FROZEN" : lifecycleState,
    replayHash,
    immutableHash,
    lineageId,
    semanticIntegrityVerified: parserValidation.valid && supported && !candidate.dangerous,
    createdAt,
    schemaVersion: INTENT_SCHEMA_VERSION,
    taxonomyVersion: INTENT_TAXONOMY_VERSION,
    parserVersion: INTENT_PARSER_VERSION,
  };

  const contractValidation = validateStructuredIntentContract(structured);
  if (!contractValidation.valid) {
    return {
      ...structured,
      lifecycleState: "FROZEN",
      semanticIntegrityVerified: false,
      semanticWarnings: Array.from(new Set([...structured.semanticWarnings, INTENT_ERROR_CODES.SCHEMA_VALIDATION_FAILED])),
      warnings: Array.from(new Set([...structured.warnings, INTENT_ERROR_CODES.SCHEMA_VALIDATION_FAILED])),
    };
  }

  return structured;
}
