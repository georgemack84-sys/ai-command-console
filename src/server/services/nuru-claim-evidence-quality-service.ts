import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
import { NuruQualityAgent } from "@/src/server/services/nuru-quality-agent";

const authority = { PRIMARY: "HIGH", SECONDARY: "MODERATE", COMMUNITY: "LOW", UNKNOWN: "LOW" } as const;
const verdict = { PASS: "SUPPORTED", PASS_WITH_WARNINGS: "PARTIALLY_SUPPORTED", CONFLICT: "CONFLICTED", NEEDS_REVIEW: "UNVERIFIED", INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE", REJECT_RECOMMENDED: "INSUFFICIENT_EVIDENCE" } as const;

/** Bridges existing Quality Agent signals into NSI claim evidence without promoting the claim. */
export const NuruClaimEvidenceQualityService = {
  async assess(claimId: string, workspaceId: string, actor: string, correlationId: string) {
    const claim = await nuruKnowledgeRepository.nuruClaimCandidate.findUnique({ where: { id: claimId } }) as Record<string, unknown> | null;
    if (!claim || claim.workspaceId !== workspaceId) throw new AppError(404, "claim_candidate_not_found", "The claim candidate was not found in this workspace.");
    const source = await nuruKnowledgeRepository.nuruSourceRegistry.findUnique({ where: { id: String(claim.sourceRegistryId) } }) as Record<string, unknown> | null;
    if (!source || source.workspaceId !== workspaceId) throw new AppError(404, "source_not_found", "The claim source was not found in this workspace.");
    const classifications = await nuruKnowledgeRepository.nuruSourceClassification.findMany({ where: { claimCandidateId: claimId, workspaceId }, orderBy: { createdAt: "desc" }, take: 1 }) as Record<string, unknown>[];
    const classification = classifications[0];
    const sourceClass = String(classification?.sourceClass ?? "UNKNOWN") as keyof typeof authority;
    const agent = await NuruQualityAgent.assess({ itemId: claimId, title: String(claim.claimText).slice(0, 180), content: String(claim.claimText), source: { sourceType: "WEB_SOURCE", origin: String(source.baseUrl ?? source.name), uri: typeof source.baseUrl === "string" ? source.baseUrl : undefined, authority: authority[sourceClass] }, contextAccurate: Boolean(classification), proposedRelationships: [], confidence: Number(claim.confidence), correlationId });
    const corroborationRecords = await nuruKnowledgeRepository.nuruClaimCorroboration.findMany({ where: { claimCandidateId: claimId, workspaceId } }) as Array<Record<string, unknown>>;
    const independentSupport = corroborationRecords.filter((record) => record.sourceRelationship === "INDEPENDENT" && record.supportsClaim === true).length;
    const dependentSupport = corroborationRecords.filter((record) => ["ORIGINAL", "DERIVED", "SYNDICATED", "CITED"].includes(String(record.sourceRelationship)) && record.supportsClaim === true).length;
    const freshness = "UNASSESSED"; const independence = independentSupport > 0 ? "INDEPENDENT_CONFIRMATION" : dependentSupport > 0 ? "DEPENDENT_ONLY" : "UNASSESSED";
    const corroboration = independentSupport > 0 ? "INDEPENDENT_SUPPORT" : dependentSupport > 0 ? "DEPENDENT_SUPPORT_ONLY" : "NOT_YET_CHECKED";
    const missingEvidence = [!classification ? "claim-context source classification" : null, "freshness assessment", independence === "UNASSESSED" ? "independence assessment" : null, independentSupport === 0 ? "independent corroborating source assessment" : null].filter(Boolean) as string[];
    if (!agent.result) throw new AppError(503, "quality_agent_unavailable", agent.error ?? "The Quality Agent did not return an assessment.");
    const result = agent.result;
    const status = result.conflictDetected ? "CONFLICTED" : missingEvidence.length > 1 ? "INSUFFICIENT_EVIDENCE" : verdict[result.status];
    const quality = await nuruKnowledgeRepository.nuruClaimEvidenceQuality.create({ data: { id: `NSI-QUALITY-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`, workspaceId, claimCandidateId: claimId, status, confidence: result.confidence, sourceAuthority: sourceClass, freshness, independence, corroboration, conflicts: result.conflictDetected ? "DETECTED" : "NONE_DETECTED", missingEvidence, warnings: result.warnings, qualityRunId: agent.runId, assessedBy: actor } }) as Record<string, unknown>;
    await NuruAuditService.record({ operation: "QUALITY_FLAGGED", actor, resourceId: claimId, inputReference: String(claim.passageReference), outputReference: String(quality.id), decision: status, reason: "Quality Agent assessed claim evidence; this does not admit the claim to canonical knowledge.", correlationId });
    return quality;
  },
  async listForClaim(claimId: string, workspaceId: string) { return nuruKnowledgeRepository.nuruClaimEvidenceQuality.findMany({ where: { claimCandidateId: claimId, workspaceId }, orderBy: { createdAt: "desc" } }); },
};
