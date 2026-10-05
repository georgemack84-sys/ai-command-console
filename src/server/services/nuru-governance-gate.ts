import { z } from "zod";
import { NuruPermissionsService } from "@/src/server/services/nuru-permissions-service";
import { recommendations } from "@/src/nuru/domain";
import { evidenceQualitySchema, NuruConfidenceService } from "@/src/server/services/nuru-confidence-service";

export const governanceProposalSchema = z.object({ proposalId: z.string().min(1), recommendation: z.enum(recommendations), qualityStatus: z.enum(["PASS", "PASS_WITH_WARNINGS", "NEEDS_REVIEW", "INSUFFICIENT_EVIDENCE", "CONFLICT", "REJECT_RECOMMENDED"]), confidence: z.number().min(0).max(1), evidenceQuality: evidenceQualitySchema, sourceAuthority: z.enum(["LOW", "MODERATE", "HIGH", "OWNER"]), requiredReview: z.boolean(), humanApproved: z.boolean().default(false), conflictDetected: z.boolean().default(false), policySatisfied: z.boolean().default(true), correlationId: z.string().min(1) });
export type GovernanceProposal = z.infer<typeof governanceProposalSchema>;
export type GovernanceOutcome = "APPROVED" | "REJECTED" | "HUMAN_REVIEW_REQUIRED" | "MORE_EVIDENCE_REQUIRED";
export type GovernanceDecision = { outcome: GovernanceOutcome; authorizedAction?: "ARCHIVE" | "SUPERSEDE"; reasons: string[]; correlationId: string };

const confidenceThreshold: Record<string, number> = { ACCEPT: 0.7, UPDATE: 0.75, MERGE: 0.8, SUPERSEDE: 0.9, REJECT: 0, HOLD: 0, REQUEST_REVIEW: 0, REQUEST_MORE_EVIDENCE: 0 };

/** Deterministic authority layer: it neither reasons about content nor trusts a Curator’s authority. */
export const NuruGovernanceGate = {
  evaluate(rawProposal: GovernanceProposal): GovernanceDecision {
    const proposal = governanceProposalSchema.parse(rawProposal);
    const reasons: string[] = [];
    if (proposal.recommendation === "REQUEST_MORE_EVIDENCE" || proposal.qualityStatus === "INSUFFICIENT_EVIDENCE") return { outcome: "MORE_EVIDENCE_REQUIRED", reasons: ["Evidence is insufficient for a durable decision."], correlationId: proposal.correlationId };
    if (proposal.recommendation === "REJECT" || proposal.qualityStatus === "REJECT_RECOMMENDED") return { outcome: "REJECTED", reasons: ["The proposal is rejected by deterministic policy."], correlationId: proposal.correlationId };
    const confidence = NuruConfidenceService.assess({ confidence: proposal.confidence, evidenceQuality: proposal.evidenceQuality, sourceAuthority: proposal.sourceAuthority, conflictDetected: proposal.conflictDetected || proposal.qualityStatus === "CONFLICT", minimumConfidence: confidenceThreshold[proposal.recommendation] ?? 1, policySatisfied: proposal.policySatisfied });
    if (proposal.recommendation === "REQUEST_REVIEW") reasons.push("Explicit review request requires human review.");
    reasons.push(...confidence.reasons);
    if (proposal.requiredReview && !proposal.humanApproved) reasons.push("Human approval is required before durable mutation.");
    if (reasons.length) return { outcome: "HUMAN_REVIEW_REQUIRED", reasons, correlationId: proposal.correlationId };
    const authorizedAction = proposal.recommendation === "SUPERSEDE" ? "SUPERSEDE" : "ARCHIVE";
    const permission = NuruPermissionsService.authorize({ subject: "nuru.governance.v1", resource: "archive", action: authorizedAction, context: { correlationId: proposal.correlationId, purpose: "Authorize a human-approved Nuru curation proposal." } });
    if (!permission.allowed) return { outcome: "REJECTED", reasons: [permission.reason], correlationId: proposal.correlationId };
    return { outcome: "APPROVED", authorizedAction, reasons: ["Policy, confidence, source authority, approval, and governance permission checks passed."], correlationId: proposal.correlationId };
  },
};
