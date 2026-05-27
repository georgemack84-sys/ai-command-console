import { validateContractPayload } from "@/services/contracts/validateContract";
import type { IntentParserResult, StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntent } from "@/types/semanticResolution";
import { canonicalIntentSchema, intentParserResultSchema, structuredIntentSchema } from "./intentSchemas";
import { INTENT_ERROR_CODES } from "@/types/intentContracts";

export function validateIntentParserResult(result: IntentParserResult) {
  const validation = validateContractPayload<IntentParserResult>({
    schema: intentParserResultSchema,
    payload: result,
  });

  return {
    valid: validation.ok,
    reasons: validation.ok ? [] : [INTENT_ERROR_CODES.SCHEMA_VALIDATION_FAILED],
  };
}

export function validateStructuredIntentContract(intent: StructuredIntent) {
  const validation = validateContractPayload<StructuredIntent>({
    schema: structuredIntentSchema,
    payload: intent,
  });

  return {
    valid: validation.ok,
    reasons: validation.ok ? [] : [INTENT_ERROR_CODES.SCHEMA_VALIDATION_FAILED],
  };
}

export function validateCanonicalIntentContract(intent: CanonicalIntent) {
  const validation = validateContractPayload<CanonicalIntent>({
    schema: canonicalIntentSchema,
    payload: intent,
  });

  return {
    valid: validation.ok,
    reasons: validation.ok ? [] : [INTENT_ERROR_CODES.INTENT_SCHEMA_INVALID],
  };
}
