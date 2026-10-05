import { z } from "zod";

export const modelRouteSchema = z.object({ modelId: z.enum(["nuru-local-v1", "nuru-fast-v1", "nuru-reasoning-v1", "nuru-strong-reasoning-v1"]), tier: z.enum(["LOCAL", "FAST", "REASONING", "STRONGEST"]), reason: z.string(), privacyPreserving: z.boolean() });
export type ModelRoute = z.infer<typeof modelRouteSchema>;
export const modelRoutingRequestSchema = z.object({ agentType: z.enum(["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY", "CURATOR"]), complexity: z.enum(["LOW", "STANDARD", "HIGH"]).default("STANDARD"), privacy: z.enum(["NORMAL", "LOCAL_ONLY"]).default("NORMAL"), costSensitivity: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"), latencySensitivity: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"), contextSize: z.number().int().nonnegative().default(0), requiredReasoning: z.enum(["LOW", "STANDARD", "HIGH"]).default("STANDARD") });

/** Deterministic routing policy. It selects a model class; provider configuration remains outside agent identity. */
export const NuruModelRouter = {
  route(rawRequest: z.input<typeof modelRoutingRequestSchema>): ModelRoute {
    const request = modelRoutingRequestSchema.parse(rawRequest);
    if (request.privacy === "LOCAL_ONLY") return { modelId: "nuru-local-v1", tier: "LOCAL", reason: "Privacy policy requires local execution.", privacyPreserving: true };
    if (request.agentType === "DISCOVERY" && request.complexity === "LOW" && request.costSensitivity !== "LOW") return { modelId: "nuru-fast-v1", tier: "FAST", reason: "Low-risk discovery favors low-latency, low-cost routing.", privacyPreserving: false };
    if (request.agentType === "QUALITY" || request.agentType === "CURATOR" || request.requiredReasoning === "HIGH" || request.complexity === "HIGH" || request.contextSize > 12_000) return { modelId: "nuru-strong-reasoning-v1", tier: "STRONGEST", reason: "Quality, synthesis, high complexity, or large context requires stronger reasoning.", privacyPreserving: false };
    return { modelId: "nuru-reasoning-v1", tier: "REASONING", reason: "Contextual classification and relationship work use standard reasoning.", privacyPreserving: false };
  },
};
