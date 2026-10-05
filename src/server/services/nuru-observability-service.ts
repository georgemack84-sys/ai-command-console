import { nuruKnowledgeRepository, type AgentRunRow } from "@/src/server/repositories/nuru-knowledge-repository";

export function summarizeNuruOperations(runs: AgentRunRow[], auditEvents: Array<{ eventType: string; actor: string }>) {
  const total = runs.length; const successful = runs.filter((run) => run.status === "success").length;
  const toolUsage = new Map<string, number>();
  for (const run of runs) for (const tool of Array.isArray(run.toolUsage) ? run.toolUsage : []) if (typeof tool === "string") toolUsage.set(tool, (toolUsage.get(tool) ?? 0) + 1);
  return { totals: { runs: total, successful, failed: total - successful, successRate: total ? Math.round((successful / total) * 100) : 0, averageLatencyMs: total ? Math.round(runs.reduce((sum, run) => sum + (run.durationMs ?? 0), 0) / total) : 0, tokenUsage: runs.reduce((sum, run) => sum + run.tokenUsage, 0), modelCost: runs.reduce((sum, run) => sum + run.modelCost, 0), retries: runs.reduce((sum, run) => sum + run.retryCount, 0), humanOverrides: auditEvents.filter((event) => event.eventType === "CURATION_APPROVED" || event.eventType === "CURATION_REJECTED").length, proposalAcceptance: auditEvents.filter((event) => event.eventType === "CURATION_APPROVED").length, proposalRejection: auditEvents.filter((event) => event.eventType === "CURATION_REJECTED").length }, byAgent: Object.entries(runs.reduce<Record<string, { runs: number; success: number; latency: number }>>((groups, run) => { const group = groups[run.agentType] ?? { runs: 0, success: 0, latency: 0 }; group.runs += 1; group.success += run.status === "success" ? 1 : 0; group.latency += run.durationMs ?? 0; groups[run.agentType] = group; return groups; }, {})).map(([agentType, metrics]) => ({ agentType, runs: metrics.runs, successRate: Math.round((metrics.success / metrics.runs) * 100), averageLatencyMs: Math.round(metrics.latency / metrics.runs) })), toolUsage: [...toolUsage.entries()].map(([tool, uses]) => ({ tool, uses })).sort((left, right) => right.uses - left.uses) };
}

export async function getNuruOperations() {
  const [runs, auditEvents] = await Promise.all([nuruKnowledgeRepository.nuruAgentRun.findMany({ orderBy: { createdAt: "desc" }, take: 500 }), nuruKnowledgeRepository.nuruAuditEvent.findMany({ where: { eventType: { in: ["CURATION_APPROVED", "CURATION_REJECTED"] } }, take: 500 })]);
  return summarizeNuruOperations(runs, auditEvents);
}
