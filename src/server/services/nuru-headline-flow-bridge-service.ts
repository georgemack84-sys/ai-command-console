import { z } from "zod";
import { AppError } from "@/src/server/api/errors";

export const headlineFlowBridgeInputSchema = z.object({ eventId: z.string().min(1), subjectId: z.string().min(1).max(200) });

/**
 * The permanent Headline Flow → Nuru boundary. Only a resolved, corroborated,
 * materially important event may become a Nuru development candidate. This
 * records evidence for curation; it does not create a knowledge item, proposal,
 * or canonical mutation.
 */
export const NuruHeadlineFlowBridgeService = {
  async createCandidate(raw: z.input<typeof headlineFlowBridgeInputSchema>, context: { workspaceId: string; actor: string; correlationId: string }) {
    headlineFlowBridgeInputSchema.parse(raw);
    void context;
    throw new AppError(503, "headline_flow_unavailable", "Headline Flow is not installed in this deployment. Install its event-registry schema and service before enabling the Nuru bridge.");
    /*
    const event = await headlineFlowEventRegistryRepository.findByIdForWorkspace(input.eventId, context.workspaceId);
    if (!event) throw new AppError(404, "headline_flow_event_not_found", "The Headline Flow event was not found in this workspace.");
    if (event.status !== "resolved") throw new AppError(409, "headline_flow_event_unstable", "Only a resolved Headline Flow event may become a Nuru candidate.");
    if (event.importance === "awareness") throw new AppError(409, "headline_flow_event_not_significant", "This event does not meet Nuru's durable-significance threshold.");
    if (event.confidence !== "multi_source" || event.sourceCount < 2) throw new AppError(409, "headline_flow_event_uncorroborated", "Nuru requires multiple independent sources before accepting a Headline Flow candidate.");
    const receipts = nuruKnowledgeRepository.nuruHeadlineFlowCandidate as unknown as { findUnique(args: unknown): Promise<{ id: string; developmentId: string; curationProposalId: string } | null>; create(args: unknown): Promise<{ id: string }> };
    const existing = await receipts.findUnique({ where: { workspaceId_eventId_eventVersion: { workspaceId: context.workspaceId, eventId: event.id, eventVersion: event.version } } });
    if (existing) return { status: "ALREADY_QUEUED" as const, development: { id: existing.developmentId }, proposal: { id: existing.curationProposalId }, event: { id: event.id, version: event.version, sourceCount: event.sourceCount, importance: event.importance } };
    const development = await NuruKnowledgeDevelopmentService.record({
      subjectId: input.subjectId,
      type: "HEADLINE_FLOW_STABILIZED_EVENT",
      eventTime: event.lastMeaningfulUpdateAt,
      publicationTime: event.firstDetectedAt,
      summary: event.summary,
      claims: [{ text: event.summary }],
      evidence: event.evidence.map((evidence) => ({ referenceId: evidence.id, kind: "HEADLINE_FLOW_EVENT_EVIDENCE", detail: `${evidence.sourceName}: ${evidence.headline}` })),
      entities: [input.subjectId],
      sourceAuthority: "MODERATE",
      verificationState: "CORROBORATING",
      provenance: { headlineFlowEventId: event.id },
    }, context);
    const curation = await createNuruCurationProposal({
      title: event.title,
      content: `${event.summary}\n\nHeadline Flow stabilization record: event ${event.id}, version ${event.version}, ${event.sourceCount} independent sources, resolved at ${event.lastMeaningfulUpdateAt}.`,
      project: "Nuru",
      source: { sourceType: "WEB_SOURCE", origin: `Headline Flow event ${event.id}`, authority: "MODERATE", version: String(event.version) },
      submission: { humanReason: "A stabilized Headline Flow event met Nuru's durable-significance threshold.", proposedTopics: [event.topic], journeyContext: "Headline Flow → Nuru bridge" },
    }, context.actor);
    const receipt = await receipts.create({ data: { workspaceId: context.workspaceId, eventId: event.id, eventVersion: event.version, subjectId: input.subjectId, developmentId: development.id, curationProposalId: curation.proposal.id } });
    return { status: "QUEUED_FOR_HUMAN_REVIEW" as const, receipt, development, proposal: curation.proposal, event: { id: event.id, version: event.version, sourceCount: event.sourceCount, importance: event.importance } };
    */
  },
};
