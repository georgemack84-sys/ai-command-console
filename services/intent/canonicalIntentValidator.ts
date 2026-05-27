import { validateContractPayload } from "@/services/contracts/validateContract";
import { canonicalIntentSchema } from "@/schemas/canonicalIntentValidationSchema";
import type { CanonicalIntent } from "@/types/semanticResolution";

export function validateCanonicalIntentShape(intent: CanonicalIntent) {
  const validation = validateContractPayload<CanonicalIntent>({
    schema: canonicalIntentSchema,
    payload: intent,
  });

  return {
    valid: validation.ok,
    reasons: validation.ok ? [] : ["CANONICAL_INTENT_INVALID"],
  };
}
