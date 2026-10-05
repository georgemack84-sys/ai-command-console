import { z } from "zod";
import { NuruCuratorAgent } from "@/src/server/services/nuru-curator-agent";
import { NuruGovernanceGate } from "@/src/server/services/nuru-governance-gate";
import { NuruArchiveService } from "@/src/server/services/nuru-archive-service";
import { sourceSchema } from "@/src/nuru/domain";
import { classifyCurationLane, NuruCurationQueueService } from "@/src/server/services/nuru-curation-queue-service";
import { NuruPriorityService } from "@/src/server/services/nuru-priority-service";

export const curationPipelineInputSchema = z.object({ title: z.string().min(3), content: z.string().min(20), project: z.string().optional(), source: sourceSchema, correlationId: z.string().min(1), humanApproved: z.boolean().default(false), approvedBy: z.string().min(1).default("human.reviewer") });
export type CurationPipelineInput = z.infer<typeof curationPipelineInputSchema>;

/** Coordinates the complete V1 path; only governance can cross the archive boundary. */
export const NuruCurationPipeline = {
  async run(rawInput: CurationPipelineInput) {
    const input = curationPipelineInputSchema.parse(rawInput);
    const curatorRun = await NuruCuratorAgent.curate(input);
    if (curatorRun.status !== "success" || !curatorRun.result || !curatorRun.result.proposal) return { status: "CURATION_INCOMPLETE" as const, curatorRun, archive: null };
    const curated = curatorRun.result;
    const qualityStatus = curated.quality?.status ?? "PASS_WITH_WARNINGS";
    const evidenceQuality: "STRONG" | "SUFFICIENT" | "NONE" | "LIMITED" = qualityStatus === "PASS" ? "STRONG" : qualityStatus === "PASS_WITH_WARNINGS" ? "SUFFICIENT" : qualityStatus === "INSUFFICIENT_EVIDENCE" ? "NONE" : "LIMITED";
    const lane = classifyCurationLane({ confidence: curated.proposal.confidence, evidenceQuality, sourceAuthority: input.source.authority, conflictDetected: qualityStatus === "CONFLICT" });
    const priority = NuruPriorityService.score({ artifactType: curated.proposal.classification, novelty: "MODERATE", projectRelevant: Boolean(curated.context?.primaryProject), sourceAuthority: input.source.authority, conflictDetected: qualityStatus === "CONFLICT", relationshipCount: curated.connections?.length ?? 0, duplicateLikely: curated.connections?.some((connection) => connection.relationshipType === "RELATED_TO") ?? false, ageDays: 0, humanPriority: 0 });
    const queue = await NuruCurationQueueService.enqueue({ proposalId: curated.proposal.id, status: "READY_FOR_REVIEW", lane, priority: priority.score, reason: `Curator synthesis is ready for governance. ${priority.factors.map((factor) => `${factor.label} ${factor.points >= 0 ? "+" : ""}${factor.points}`).join("; ")}`, correlationId: input.correlationId });
    const governance = NuruGovernanceGate.evaluate({ proposalId: curated.proposal.id, recommendation: curated.proposal.recommendation, qualityStatus, confidence: curated.proposal.confidence, evidenceQuality, sourceAuthority: input.source.authority, requiredReview: curated.proposal.requiredReview, humanApproved: input.humanApproved, conflictDetected: qualityStatus === "CONFLICT", policySatisfied: true, correlationId: input.correlationId });
    if (governance.outcome !== "APPROVED") return { status: governance.outcome, curatorRun, proposal: curated.proposal, queue, governance, archive: null };
    await NuruCurationQueueService.transition({ queueId: (queue as { id: string }).id, status: "APPROVED", lane, reason: "Governance approved the curation proposal.", actor: "nuru.governance.v1", correlationId: input.correlationId });
    const archive = governance.authorizedAction === "SUPERSEDE"
      ? null // Explicit predecessor selection is required; never infer a supersession target.
      : await NuruArchiveService.store({ title: input.title, content: input.content, contentType: curated.proposal.classification, project: curated.context?.primaryProject ?? input.project, relatedProjects: curated.context?.relatedProjects ?? [], source: input.source, confidence: curated.proposal.confidence, metadata: { project: curated.context?.primaryProject ?? input.project ?? "Nuru", relatedProjects: curated.context?.relatedProjects ?? [], classification: curated.proposal.classification }, tags: [], lineage: [
        { stage: "DISCOVERY", referenceId: curated.provenance?.discoveryRunId ?? curatorRun.runId, actor: "nuru.discovery.v1", details: {} },
        { stage: "CONTEXT", referenceId: curated.provenance?.contextRunId ?? curatorRun.runId, actor: "nuru.context.v1", details: {} },
        ...(curated.provenance?.connectionRunId ? [{ stage: "CONNECTION" as const, referenceId: curated.provenance.connectionRunId, actor: "nuru.connection.v1", details: {} }] : []),
        ...(curated.provenance?.qualityRunId ? [{ stage: "QUALITY" as const, referenceId: curated.provenance.qualityRunId, actor: "nuru.quality.v1", details: {} }] : []),
        { stage: "CURATION_PROPOSAL", referenceId: curated.proposal.id, actor: "nuru.curator.v1", details: {} },
        { stage: "HUMAN_APPROVAL", referenceId: `HA-${crypto.randomUUID()}`, actor: input.approvedBy, details: {} },
      ] }, "nuru.governance.v1");
    if (archive) await NuruCurationQueueService.transition({ queueId: (queue as { id: string }).id, status: "ARCHIVED", lane, reason: "Approved knowledge was archived.", actor: "nuru.governance.v1", correlationId: input.correlationId });
    return { status: archive ? "ARCHIVED" as const : "APPROVED_REQUIRES_SUPERSESSION_TARGET" as const, curatorRun, proposal: curated.proposal, queue, governance, archive };
  },
};
