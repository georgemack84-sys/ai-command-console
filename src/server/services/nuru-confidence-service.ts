import { z } from "zod";
import { confidenceBand, confidenceBandSchema } from "@/src/nuru/confidence";

export const evidenceQualitySchema = z.enum(["NONE", "LIMITED", "SUFFICIENT", "STRONG"]);
export const confidenceAssessmentInputSchema = z.object({ confidence: z.number().min(0).max(1), evidenceQuality: evidenceQualitySchema, sourceAuthority: z.enum(["LOW", "MODERATE", "HIGH", "OWNER"]), conflictDetected: z.boolean(), minimumConfidence: z.number().min(0).max(1), policySatisfied: z.boolean() });
export type ConfidenceAssessmentInput = z.infer<typeof confidenceAssessmentInputSchema>;
export type ConfidenceAssessment = { score: number; band: z.infer<typeof confidenceBandSchema>; eligibleForGovernance: boolean; reviewRequired: boolean; reasons: string[] };

/** Deterministically combines confidence with evidence, authority, policy, and conflict signals. */
export const NuruConfidenceService = {
  assess(rawInput: ConfidenceAssessmentInput): ConfidenceAssessment {
    const input = confidenceAssessmentInputSchema.parse(rawInput); const band = confidenceBand(input.confidence); const reasons: string[] = [];
    if (input.confidence < input.minimumConfidence) reasons.push("Confidence does not meet the recommendation policy threshold.");
    if (!input.policySatisfied) reasons.push("The applicable policy is not satisfied.");
    if (["NONE", "LIMITED"].includes(input.evidenceQuality)) reasons.push("Evidence quality requires further review.");
    if (input.sourceAuthority === "LOW") reasons.push("Low-authority sources require human review.");
    if (input.conflictDetected) reasons.push("A conflict requires human review.");
    const eligibleForGovernance = input.confidence >= input.minimumConfidence && input.policySatisfied && ["SUFFICIENT", "STRONG"].includes(input.evidenceQuality) && ["HIGH", "OWNER"].includes(input.sourceAuthority) && !input.conflictDetected;
    return { score: input.confidence, band, eligibleForGovernance, reviewRequired: !eligibleForGovernance, reasons };
  },
};
