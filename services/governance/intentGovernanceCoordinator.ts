import type { StructuredIntent } from "@/types/intentContracts";
import { evaluatePlannerAdmissionAuthority } from "@/services/intent-governance/plannerAdmissionAuthority";

export function coordinateIntentGovernance(structuredIntent: StructuredIntent) {
  return evaluatePlannerAdmissionAuthority(structuredIntent);
}
