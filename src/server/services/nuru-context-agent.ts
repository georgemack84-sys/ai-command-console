import { z } from "zod";
import { contextAgentOutputSchema } from "@/src/nuru/domain";
import { confidenceBand } from "@/src/nuru/confidence";
import { NuruProjectService, nuruProjects } from "@/src/server/services/nuru-project-service";
import { NuruAgentRuntime, nuruAgentDefinitions } from "@/src/server/services/nuru-agent-runtime";
import { validateMetadata } from "@/src/server/services/nuru-metadata-service";

export const contextAgentInputSchema = z.object({ candidateId: z.string().min(1), title: z.string().min(1), content: z.string().min(1), project: z.string().optional(), sourceOrigin: z.string().min(1), correlationId: z.string().min(1) });
export type ContextAgentInput = z.infer<typeof contextAgentInputSchema>;
const runtime = new NuruAgentRuntime(nuruAgentDefinitions, [
  { name: "get_item", resource: "knowledge", action: "READ", description: "Read the candidate." },
  { name: "get_metadata", resource: "metadata", action: "READ", description: "Read normalized metadata." },
  { name: "submit_context_assessment", resource: "proposals", action: "PROPOSE", description: "Submit a context assessment." },
]);

function topicFrom(content: string, fallback: string) { return /agent\s*\/\s*service|agent.*service|service.*agent/i.test(content) ? "Agent / Service Boundary" : fallback; }

export const NuruContextAgent = {
  async assess(rawInput: ContextAgentInput) {
    const input = contextAgentInputSchema.parse(rawInput);
    return runtime.run("nuru.context.v1", { objective: "Determine the candidate’s proper scope and meaning.", context: { candidateId: input.candidateId }, tokenBudget: 2_000, timeBudgetMs: 10_000, correlationId: input.correlationId }, async (run) => {
      const artifactType = /architecture|service|agent|governance/i.test(input.content) ? "Architecture Decision" : "Knowledge Note";
      const mentionedProjects = nuruProjects.filter((project) => new RegExp(`\\b${project.replace(" ", "\\s+")}\\b`, "i").test(`${input.title} ${input.content}`));
      const requestedProject = nuruProjects.includes(input.project as typeof nuruProjects[number]) ? input.project as typeof nuruProjects[number] : undefined;
      const projectScope = NuruProjectService.normalize({ primaryProject: requestedProject ?? mentionedProjects[0] ?? "Nuru", relatedProjects: mentionedProjects.filter((project) => project !== (requestedProject ?? mentionedProjects[0] ?? "Nuru")) });
      const project = projectScope.primaryProject; const topic = topicFrom(input.content, input.title); const scope = /v1/i.test(input.content) ? "Nuru V1" : "Current Nuru scope";
      const metadata = { project, phase: "V1", topic, scope, artifactType, confidence: 0.96 };
      const validated = artifactType === "Architecture Decision" ? validateMetadata("Architecture Decision", metadata) : validateMetadata("Knowledge Note", { topic, scope, artifactType, confidence: 0.8, project });
      if (!validated.success) throw new Error("Context metadata did not satisfy the controlled schema.");
      const dependencies = /archive|search|metadata|audit|embedding|permission/i.test(input.content) ? ["Archive", "Search", "Metadata", "Audit", "Embeddings", "Permissions"] : [];
      const assessment = { candidateId: input.candidateId, itemId: input.candidateId, project, primaryProject: project, relatedProjects: projectScope.relatedProjects, topic, artifactType, scope, topics: [topic, "service boundary"], sourceContext: input.sourceOrigin, likelyPurpose: "Establish shared operating context for Nuru curation.", dependencies, applicableSystem: "Nuru", historicalContext: "Nuru V1", relatedComponents: /curator/i.test(input.content) ? ["Curator"] : ["Curator", "Agent Runtime"], confidence: validated.data.confidence, confidenceBand: confidenceBand(validated.data.confidence), reasoningSummary: `Classified as ${artifactType} from the candidate’s stated scope, subject, and source.` };
      await run.invokeTool("submit_context_assessment", assessment);
      return assessment;
    }, contextAgentOutputSchema);
  },
};
