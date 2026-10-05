import { z } from "zod";
import { NuruCuratorAgent } from "@/src/server/services/nuru-curator-agent";
import { NuruGovernanceGate } from "@/src/server/services/nuru-governance-gate";
import { NuruArchiveService } from "@/src/server/services/nuru-archive-service";
import { NuruCurationProposalStoreService } from "@/src/server/services/nuru-curation-proposal-store-service";
import { sourceSchema } from "@/src/nuru/domain";
import { classifyCurationLane, NuruCurationQueueService } from "@/src/server/services/nuru-curation-queue-service";
import { NuruPriorityService } from "@/src/server/services/nuru-priority-service";
export const curationPipelineInputSchema = z.object({ title: z.string().min(3), content: z.string().min(20), project: z.string().optional(), source: sourceSchema, correlationId: z.string().min(1), submissionReceiptId: z.string().min(1).optional(), humanApproved: z.boolean().default(false), approvedBy: z.string().min(1).default("human.reviewer") }); export type CurationPipelineInput = z.infer<typeof curationPipelineInputSchema>;
/** Coordinates the complete V1 path; one materialized item survives from review to archive. */
export const NuruCurationPipeline = { async run(rawInput: CurationPipelineInput) {
  const input = curationPipelineInputSchema.parse(rawInput), curatorRun = await NuruCuratorAgent.curate(input);
  if (curatorRun.status !== "success" || !curatorRun.result?.proposal) return { status: "CURATION_INCOMPLETE" as const, curatorRun, archive: null };
  const curated = curatorRun.result, materialized = await NuruCurationProposalStoreService.materialize({ title: input.title, content: input.content, project: curated.context?.primaryProject ?? input.project, relatedProjects: curated.context?.relatedProjects ?? [], source: input.source, proposal: curated.proposal, correlationId: input.correlationId, submissionReceiptId: input.submissionReceiptId });
  const proposal = { ...curated.proposal, id: materialized.proposal.id, itemId: materialized.item.id }, qualityStatus = curated.quality?.status ?? "PASS_WITH_WARNINGS";
  const evidenceQuality: "STRONG" | "SUFFICIENT" | "NONE" | "LIMITED" = qualityStatus === "PASS" ? "STRONG" : qualityStatus === "PASS_WITH_WARNINGS" ? "SUFFICIENT" : qualityStatus === "INSUFFICIENT_EVIDENCE" ? "NONE" : "LIMITED";
  const lane = classifyCurationLane({ confidence: proposal.confidence, evidenceQuality, sourceAuthority: input.source.authority, conflictDetected: qualityStatus === "CONFLICT" });
  const priority = NuruPriorityService.score({ artifactType: proposal.classification, novelty: "MODERATE", projectRelevant: Boolean(curated.context?.primaryProject), sourceAuthority: input.source.authority, conflictDetected: qualityStatus === "CONFLICT", relationshipCount: curated.connections?.length ?? 0, duplicateLikely: curated.connections?.some(connection => connection.relationshipType === "RELATED_TO") ?? false, ageDays: 0, humanPriority: 0 });
  const queue = await NuruCurationQueueService.enqueue({ itemId: materialized.item.id, proposalId: proposal.id, status: "READY_FOR_REVIEW", lane, priority: priority.score, reason: `Curator synthesis is ready for governance. ${priority.factors.map(factor => `${factor.label} ${factor.points >= 0 ? "+" : ""}${factor.points}`).join("; ")}`, correlationId: input.correlationId });
  const governance = NuruGovernanceGate.evaluate({ proposalId: proposal.id, recommendation: proposal.recommendation, qualityStatus, confidence: proposal.confidence, evidenceQuality, sourceAuthority: input.source.authority, requiredReview: proposal.requiredReview, humanApproved: input.humanApproved, conflictDetected: qualityStatus === "CONFLICT", policySatisfied: true, correlationId: input.correlationId });
  if (governance.outcome !== "APPROVED") return { status: governance.outcome, curatorRun, proposal, queue, governance, archive: null };
  await NuruCurationQueueService.transition({ queueId: (queue as { id: string }).id, status: "APPROVED", lane, reason: "Governance approved the curation proposal.", actor: "nuru.governance.v1", correlationId: input.correlationId });
  const archive = governance.authorizedAction === "SUPERSEDE" ? null : await NuruArchiveService.archiveExisting(materialized.item.id, "nuru.governance.v1", input.correlationId);
  if (archive) await NuruCurationQueueService.transition({ queueId: (queue as { id: string }).id, status: "ARCHIVED", lane, reason: "Approved knowledge was archived.", actor: "nuru.governance.v1", correlationId: input.correlationId });
  return { status: archive ? "ARCHIVED" as const : "APPROVED_REQUIRES_SUPERSESSION_TARGET" as const, curatorRun, proposal, queue, governance, archive };
} };
