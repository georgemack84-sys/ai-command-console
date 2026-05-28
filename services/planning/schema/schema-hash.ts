import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import type { CanonicalPlan } from "../contracts/plan-types";
import { normalizeCanonicalPlan } from "./schema-normalizer";

export function hashCanonicalPlan(plan: CanonicalPlan) {
  return hashPayloadDeterministically(normalizeCanonicalPlan(plan));
}

