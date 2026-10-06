import { z } from "zod";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
import { NuruPermissionsService, type NuruPermissionAction } from "@/src/server/services/nuru-permissions-service";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { nuruToolRegistry, type NuruToolRegistry } from "@/src/server/services/nuru-tool-registry";
import { nuruAgentIdentities, type NuruAgentIdentity } from "@/src/server/services/nuru-agent-identity-service";
import { NuruModelRouter, type ModelRoute } from "@/src/server/services/nuru-model-router";
import { NuruVersionRegistry } from "@/src/server/services/nuru-version-registry";

export type NuruAgentId = "nuru.discovery.v1" | "nuru.context.v1" | "nuru.connection.v1" | "nuru.quality.v1" | "nuru.curator.v1";
export const agentRunRequestSchema = z.object({ objective: z.string().trim().min(3).max(2000), context: z.record(z.string(), z.unknown()).default({}), tokenBudget: z.number().int().min(1).max(200_000), timeBudgetMs: z.number().int().min(1).max(300_000), correlationId: z.string().trim().min(1), modelConstraints: z.object({ complexity: z.enum(["LOW", "STANDARD", "HIGH"]).optional(), privacy: z.enum(["NORMAL", "LOCAL_ONLY"]).optional(), costSensitivity: z.enum(["LOW", "NORMAL", "HIGH"]).optional(), latencySensitivity: z.enum(["LOW", "NORMAL", "HIGH"]).optional(), requiredReasoning: z.enum(["LOW", "STANDARD", "HIGH"]).optional() }).optional(), replayVersions: z.object({ modelVersion: z.string().min(1), promptVersion: z.string().min(1), policyVersion: z.string().min(1) }).optional() });
export type AgentRunRequest = z.infer<typeof agentRunRequestSchema>;
export type NuruToolDefinition = { name: string; resource: "knowledge" | "metadata" | "relationships" | "proposals" | "archive" | "permissions" | "audit" | "embeddings"; action: NuruPermissionAction; description: string };
export type NuruAgentDefinition = NuruAgentIdentity & { modelVersion: string; policyVersion: string; allowedTools: string[] };
export type AgentRunResult<T> = { runId: string; agentId: string; correlationId: string; status: "success" | "failure" | "timeout" | "permission_denied" | "budget_exceeded" | "invalid_output"; result?: T; error?: string; durationMs: number; modelRoute?: ModelRoute };
export type AgentExecutionContext = { runId: string; objective: string; context: Record<string, unknown>; allowedTools: NuruToolDefinition[]; tokenBudget: number; correlationId: string; invokeTool: (name: string, input: unknown) => Promise<unknown> };

export interface NuruModelProvider { readonly model: string; execute<T>(context: AgentExecutionContext, operation: () => Promise<T>): Promise<T>; }
export const localModelProvider: NuruModelProvider = { model: "local-runtime-v1", execute: async (_context, operation) => operation() };

export class NuruAgentRuntime {
  constructor(private readonly agents: NuruAgentDefinition[], private readonly tools: NuruToolDefinition[], private readonly model: NuruModelProvider = localModelProvider, private readonly toolRegistry: Pick<NuruToolRegistry, "invoke"> = nuruToolRegistry) {}

  async run<T>(agentId: string, rawRequest: AgentRunRequest, operation: (context: AgentExecutionContext) => Promise<T>, outputSchema?: z.ZodType<unknown>): Promise<AgentRunResult<T>> {
    const request = agentRunRequestSchema.parse(rawRequest);
    const runId = crypto.randomUUID(); const startedAt = Date.now();
    const agent = this.agents.find((candidate) => candidate.agentId === agentId);
    if (!agent || (agent.status && agent.status !== "ACTIVE")) return { runId, agentId, correlationId: request.correlationId, status: "failure", error: agent ? `Nuru agent is ${agent.status.toLowerCase()}.` : "Unknown Nuru agent.", durationMs: 0 };
    const modelRoute = NuruModelRouter.route({ agentType: agent.agentType, contextSize: JSON.stringify(request.context).length, complexity: request.modelConstraints?.complexity ?? (request.tokenBudget > 6_000 ? "HIGH" : agent.agentType === "DISCOVERY" ? "LOW" : "STANDARD"), privacy: request.modelConstraints?.privacy, costSensitivity: request.modelConstraints?.costSensitivity, latencySensitivity: request.modelConstraints?.latencySensitivity, requiredReasoning: request.modelConstraints?.requiredReasoning });
    const allowedTools = this.tools.filter((tool) => agent.allowedTools.includes(tool.name));
    const undeclaredToolNames = agent.allowedTools.filter((name) => !allowedTools.some((tool) => tool.name === name));
    if (undeclaredToolNames.length) {
      const error = `Agent declares unavailable tools: ${undeclaredToolNames.join(", ")}.`;
      await NuruAuditService.record({ operation: "AGENT_RESULT_RECEIVED", actor: agent.agentId, agentRunId: runId, resourceId: "runtime", decision: "FAILURE", reason: error, correlationId: request.correlationId });
      return { runId, agentId, correlationId: request.correlationId, status: "failure", error, durationMs: Date.now() - startedAt };
    }
    for (const tool of allowedTools) {
      const decision = NuruPermissionsService.authorize({ subject: agent.agentId, resource: tool.resource, action: tool.action, context: { correlationId: request.correlationId, purpose: request.objective } });
      if (!decision.allowed) return { runId, agentId, correlationId: request.correlationId, status: "permission_denied", error: decision.reason, durationMs: Date.now() - startedAt };
    }
    const context: AgentExecutionContext = { runId, objective: request.objective, context: request.context, allowedTools, tokenBudget: request.tokenBudget, correlationId: request.correlationId, invokeTool: (name, input) => {
      if (!allowedTools.some((tool) => tool.name === name)) return Promise.reject(new Error(`Tool ${name} is not declared for ${agent.agentId}.`));
      return this.toolRegistry.invoke(name, input, { agentId: agent.agentId, runId, correlationId: request.correlationId, objective: request.objective });
    } };
    const estimatedTokenUsage = Math.min(request.tokenBudget, Math.ceil((request.objective.length + JSON.stringify(request.context).length) / 4));
    const versionSnapshot = NuruVersionRegistry.snapshot(agent.agentId);
    await nuruKnowledgeRepository.nuruAgentRun.create({ data: { id: runId, proposalId: typeof request.context.proposalId === "string" ? request.context.proposalId : null, agentId: agent.agentId, agentType: agent.agentType, status: "running", objective: request.objective, inputContext: request.context, result: {}, correlationId: request.correlationId, model: request.replayVersions?.modelVersion ?? modelRoute.modelId, promptVersion: request.replayVersions?.promptVersion ?? agent.promptVersion, policyVersion: request.replayVersions?.policyVersion ?? agent.policyVersion, identitySnapshot: { ...agent, modelRoute, replayVersions: request.replayVersions, versionSnapshot }, tokenUsage: estimatedTokenUsage, toolUsage: allowedTools.map((tool) => tool.name), modelCost: 0, retryCount: 0 } });
    await NuruAuditService.record({ operation: "AGENT_RUN_STARTED", actor: agent.agentId, agentRunId: runId, resourceId: String(request.context.itemId ?? "runtime"), inputReference: request.objective, correlationId: request.correlationId });
    try {
      const result = await Promise.race([this.model.execute(context, () => operation(context)), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Agent run exceeded its time budget.")), request.timeBudgetMs))]);
      const validatedResult = outputSchema ? outputSchema.parse(result) as T : result;
      await nuruKnowledgeRepository.nuruAgentRun.update({ where: { id: runId }, data: { status: "success", result: validatedResult, durationMs: Date.now() - startedAt } });
      await NuruAuditService.record({ operation: "AGENT_RESULT_RECEIVED", actor: agent.agentId, agentRunId: runId, resourceId: String(request.context.itemId ?? "runtime"), outputReference: "validated", decision: "SUCCESS", reason: "Agent result passed its declared output contract.", correlationId: request.correlationId });
      return { runId, agentId, correlationId: request.correlationId, status: "success", result: validatedResult, durationMs: Date.now() - startedAt, modelRoute };
    } catch (error) {
      const timeout = error instanceof Error && error.message.includes("time budget"); const invalidOutput = error instanceof z.ZodError;
      const status = timeout ? "timeout" : invalidOutput ? "invalid_output" : "failure";
      await nuruKnowledgeRepository.nuruAgentRun.update({ where: { id: runId }, data: { status, result: { error: error instanceof Error ? error.message : "Unknown failure" }, durationMs: Date.now() - startedAt } });
      await NuruAuditService.record({ operation: "AGENT_RESULT_RECEIVED", actor: agent.agentId, agentRunId: runId, resourceId: String(request.context.itemId ?? "runtime"), decision: status.toUpperCase(), reason: error instanceof Error ? error.message.slice(0, 2_000) : "Unknown agent failure.", correlationId: request.correlationId });
      return { runId, agentId, correlationId: request.correlationId, status, error: error instanceof Error ? error.message : "Unknown failure", durationMs: Date.now() - startedAt, modelRoute };
    }
  }
}

export const nuruAgentDefinitions: NuruAgentDefinition[] = nuruAgentIdentities.map((identity) => ({ ...identity, modelVersion: identity.version, policyVersion: "nuru-governance-v1", allowedTools: [...identity.tools] }));
