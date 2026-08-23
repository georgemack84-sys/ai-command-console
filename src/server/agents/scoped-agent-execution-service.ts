import { generateStructuredSummary } from "@/src/server/services/ai-service";
import type { RuntimeKnowledgeContext } from "@/src/server/knowledge/scope-types";

export type ScopedAgentTaskInput = {
  workspaceName: string;
  taskType: string;
  objective: string;
  knowledgeContext: RuntimeKnowledgeContext;
  traceId?: string | null;
};

function compactContent(value: string) {
  return value.length <= 700 ? value : `${value.slice(0, 697)}…`;
}

export function buildScopedAgentEvidence(context: RuntimeKnowledgeContext) {
  return context.entries.slice(0, 12).map((entry) => `[${entry.id}] ${entry.title}: ${compactContent(entry.content)}`);
}

export async function runScopedAgentTask(input: ScopedAgentTaskInput) {
  const evidence = buildScopedAgentEvidence(input.knowledgeContext);
  const summary = await generateStructuredSummary({
    workspaceName: input.workspaceName,
    summaryType: "triage-brief",
    focus: `${input.taskType} task: ${input.objective}`,
    bulletPoints: evidence.length ? evidence : ["No scoped knowledge was attached; respond only to the task objective."],
    traceId: input.traceId ?? undefined,
  });

  return {
    answer: [summary.summary, ...summary.bullets.map((bullet) => `- ${bullet}`)].join("\n"),
    knowledgeCitations: input.knowledgeContext.entries.map((entry) => entry.id),
    scope: input.knowledgeContext.scope,
    provider: summary.provider,
    model: summary.model,
    traceId: summary.traceId,
    fallbackReason: summary.fallbackReason,
  };
}
