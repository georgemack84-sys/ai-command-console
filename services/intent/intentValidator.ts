import { INTENT_ERROR_CODES, type StructuredIntent } from "@/types/intentContracts";
import type { IntentValidationResult } from "@/types/intentValidation";
import { validateStructuredIntentContract, validateCanonicalIntentContract } from "./parserContractValidator";
import { isToolCompatibleAction } from "./intentPolicies";

export function validateCanonicalizedIntent(input: {
  structuredIntent: StructuredIntent;
  canonicalIntent: IntentValidationResult["canonicalIntent"];
}): IntentValidationResult {
  const schemaValidation = validateStructuredIntentContract(input.structuredIntent);
  const canonicalValidation = validateCanonicalIntentContract(input.canonicalIntent);

  const semanticValid =
    !/^filesystem\./.test(input.canonicalIntent.action) || !/^localhost$/i.test(input.canonicalIntent.target);
  const supported = input.canonicalIntent.supported;
  const governanceValid = input.canonicalIntent.governanceRisk !== "blocked";
  const toolCompatible = isToolCompatibleAction(input.canonicalIntent.action);
  const lowConfidence = input.canonicalIntent.confidence < 0.7;
  const ambiguous = input.canonicalIntent.clarificationRequired || input.canonicalIntent.ambiguities.length > 0;

  const blockedReasons = [
    ...(schemaValidation.valid ? [] : [INTENT_ERROR_CODES.INTENT_SCHEMA_INVALID]),
    ...(canonicalValidation.valid ? [] : [INTENT_ERROR_CODES.INTENT_SCHEMA_INVALID]),
    ...(semanticValid ? [] : [INTENT_ERROR_CODES.INTENT_SEMANTIC_INVALID]),
    ...(supported ? [] : [INTENT_ERROR_CODES.INTENT_UNSUPPORTED]),
    ...(governanceValid ? [] : [INTENT_ERROR_CODES.INTENT_GOVERNANCE_BLOCKED]),
    ...(toolCompatible ? [] : [INTENT_ERROR_CODES.INTENT_TOOL_UNAVAILABLE]),
    ...(ambiguous ? [INTENT_ERROR_CODES.INTENT_AMBIGUOUS] : []),
    ...(lowConfidence ? [INTENT_ERROR_CODES.INTENT_CONFIDENCE_TOO_LOW] : []),
  ];

  return {
    valid: blockedReasons.length === 0,
    schemaValid: schemaValidation.valid && canonicalValidation.valid,
    semanticValid,
    governanceValid,
    toolCompatible,
    clarificationRequired: ambiguous || lowConfidence,
    blockedReasons,
    warnings: [...input.canonicalIntent.warnings],
    canonicalIntent: {
      ...input.canonicalIntent,
      validation: {
        schemaValid: schemaValidation.valid && canonicalValidation.valid,
        semanticValid,
        governanceValid,
        toolCompatible,
      },
      clarificationRequired: ambiguous || lowConfidence,
      warnings: Array.from(new Set([
        ...input.canonicalIntent.warnings,
        ...(lowConfidence ? [INTENT_ERROR_CODES.INTENT_CONFIDENCE_TOO_LOW] : []),
      ])),
    },
  };
}
