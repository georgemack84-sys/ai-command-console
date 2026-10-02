import { z } from "zod";
import { NuruAgentRuntime, nuruAgentDefinitions } from "@/src/server/services/nuru-agent-runtime";
import { NuruDiscoveryAgent } from "@/src/server/services/nuru-discovery-agent";
import { NuruContextAgent } from "@/src/server/services/nuru-context-agent";
import { NuruConnectionAgent } from "@/src/server/services/nuru-connection-agent";
import { NuruQualityAgent } from "@/src/server/services/nuru-quality-agent";
import { curatorAgentOutputSchema, sourceSchema } from "@/src/nuru/domain";
import { buildCurationProposal } from "@/src/server/services/nuru-curation-proposal-service";
import { buildDegradedCuration } from "@/src/server/services/nuru-agent-failure-service";
import { NuruCuratorMemoryService, type CuratorMemoryPacket } from "@/src/server/services/nuru-curator-memory-service";
import { NuruAgentCollaborationProtocol } from "@/src/server/services/nuru-agent-collaboration-protocol";
import { NuruWorkflowTemplateService } from "@/src/server/services/nuru-workflow-template-service";
import { NuruRunBudgetService } from "@/src/server/services/nuru-run-budget-service";

export const curatorInputSchema = z.object({ title: z.string().min(3), content: z.string().min(20), project: z.string().optional(), source: sourceSchema, correlationId: z.string().min(1) });
export type CuratorInput = z.infer<typeof curatorInputSchema>;
export type CuratorReplayVersions = { modelVersion: string; promptVersion: string; policyVersion: string };
const runtime = new NuruAgentRuntime(nuruAgentDefinitions, [
  { name: "get_item", resource: "knowledge", action: "READ", description: "Read specialist inputs." },
  { name: "get_curator_memory", resource: "knowledge", action: "READ", description: "Read the bounded, governed curator context packet." },
  { name: "submit_proposal", resource: "proposals", action: "PROPOSE", description: "Submit the curator synthesis." },
]);

/** Orchestrates specialists; it never archives, approves, or replaces knowledge. */
export const NuruCuratorAgent = {
  async curate(rawInput: CuratorInput, replayVersions?: CuratorReplayVersions) {
    const input = curatorInputSchema.parse(rawInput); const template = NuruWorkflowTemplateService.select({ sourceAuthority: input.source.authority, content: input.content, contentLength: input.content.length }); const standard = template.id !== "FAST_PATH";
    const budget = NuruRunBudgetService.forTemplate(template.id);
    const project = input.project ?? "Nuru";
    return runtime.run("nuru.curator.v1", { objective: "Execute the policy-selected curation workflow template and synthesize specialist evidence.", context: { title: input.title, project, workflowTemplate: template.id, workflowStages: template.stages, curationInput: input }, tokenBudget: standard ? 8_000 : 4_000, timeBudgetMs: standard ? 45_000 : 25_000, correlationId: input.correlationId, replayVersions }, async (execution) => {
      const curatorMemory = await execution.invokeTool("get_curator_memory", { project }).catch(() => NuruCuratorMemoryService.unavailable(project)) as CuratorMemoryPacket;
      const discoveryRun = await NuruAgentCollaborationProtocol.dispatch({ coordinator: "nuru.curator.v1", workflow: standard ? "STANDARD" : "FAST", sequence: 1, specialist: "DISCOVERY", resourceId: input.title, correlationId: input.correlationId }, () => NuruDiscoveryAgent.discover({ title: input.title, content: input.content, source: input.source, context: {}, correlationId: input.correlationId }), budget);
      if (discoveryRun.status !== "success" || !discoveryRun.result) return { workflow: standard ? "STANDARD" : "FAST", curation: buildDegradedCuration([{ specialist: "Discovery", status: discoveryRun.status === "timeout" ? "timeout" : "failure", detail: discoveryRun.error }]), proposal: null };
      const candidate = discoveryRun.result;
      const contextRun = await NuruAgentCollaborationProtocol.dispatch({ coordinator: "nuru.curator.v1", workflow: standard ? "STANDARD" : "FAST", sequence: 2, specialist: "CONTEXT", resourceId: candidate.id, correlationId: input.correlationId }, () => NuruContextAgent.assess({ candidateId: candidate.id, title: input.title, content: input.content, project: input.project, sourceOrigin: input.source.origin, correlationId: input.correlationId }), budget);
      if (contextRun.status !== "success" || !contextRun.result) return { workflow: standard ? "STANDARD" : "FAST", candidate, curation: buildDegradedCuration([{ specialist: "Discovery", status: "success" }, { specialist: "Context", status: contextRun.status === "timeout" ? "timeout" : "failure", detail: contextRun.error }]), proposal: null };
      const context = contextRun.result;
      let connectionRun: Awaited<ReturnType<typeof NuruConnectionAgent.connect>> | undefined;
      let qualityRun: Awaited<ReturnType<typeof NuruQualityAgent.assess>> | undefined;
      if (standard) {
        const connection = await NuruAgentCollaborationProtocol.dispatch({ coordinator: "nuru.curator.v1", workflow: "STANDARD", sequence: 3, specialist: "CONNECTION", resourceId: candidate.id, correlationId: input.correlationId }, () => NuruConnectionAgent.connect({ itemId: candidate.id, title: input.title, content: input.content, project: context.primaryProject, relatedProjects: context.relatedProjects, correlationId: input.correlationId, limit: 10 }), budget);
        connectionRun = connection;
        qualityRun = await NuruAgentCollaborationProtocol.dispatch({ coordinator: "nuru.curator.v1", workflow: "STANDARD", sequence: 4, specialist: "QUALITY", resourceId: candidate.id, correlationId: input.correlationId }, () => NuruQualityAgent.assess({ itemId: candidate.id, title: input.title, content: input.content, source: input.source, contextAccurate: true, proposedRelationships: connection.result?.proposals ?? [], confidence: candidate.confidence, correlationId: input.correlationId }), budget);
      }
      const quality = qualityRun?.result;
      const recommendation = quality?.status === "CONFLICT" ? "REQUEST_REVIEW" : quality?.status === "INSUFFICIENT_EVIDENCE" ? "REQUEST_MORE_EVIDENCE" : "ACCEPT";
      const proposal = buildCurationProposal({ itemId: candidate.id, classification: contextRun.result.artifactType, project: input.project ?? "Nuru", recommendation, relationships: (connectionRun?.result?.proposals ?? []).map(({ targetItemId, relationshipType, confidence, evidence, proposedBy, status }) => ({ targetItemId, relationshipType, confidence, evidence, proposedBy, status })), qualityStatus: quality?.status ?? "PASS_WITH_WARNINGS", confidence: quality?.confidence ?? candidate.confidence, evidence: [candidate.reasonDiscovered ?? "Discovery candidate", "Context assessment completed", ...(quality ? ["Quality assessment completed"] : [])], reasoningSummary: "Curator synthesis of specialist evidence. Governance must independently authorize any durable mutation.", warnings: quality?.warnings ?? [], correlationId: input.correlationId });
      const curation = buildDegradedCuration([{ specialist: "Discovery", status: "success" }, { specialist: "Context", status: "success" }, ...(standard ? [{ specialist: "Connection", status: connectionRun?.status === "success" ? "success" as const : "failure" as const, detail: connectionRun?.error }, { specialist: "Quality", status: qualityRun?.status === "success" ? "success" as const : "failure" as const, detail: qualityRun?.error }] : [])]);
      return { workflow: standard ? "STANDARD" : "FAST", workflowTemplate: template.id, specialists: standard ? ["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY"] : ["DISCOVERY", "CONTEXT"], candidate, context, curatorMemory: curatorMemory.summary, connections: connectionRun?.result?.proposals ?? [], quality, curation, provenance: { discoveryRunId: discoveryRun.runId, contextRunId: contextRun.runId, ...(connectionRun ? { connectionRunId: connectionRun.runId } : {}), ...(qualityRun ? { qualityRunId: qualityRun.runId } : {}), proposalId: proposal.id }, proposal };
    }, curatorAgentOutputSchema);
  },
};
