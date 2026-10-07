import { resolve } from "node:path";

import { DeferredCandidateReviewQueueService, FileDeferredCandidateRegistry, FileDeferredCandidateResolutionLedger } from "@/services/learning-constitution";

const workspaceIdPattern = /^[A-Za-z0-9_-]+$/;

/** Creates workspace-isolated durable queue storage for authenticated read models. */
export function createDeferredCandidateReviewQueue(workspaceId: string) {
  if (!workspaceIdPattern.test(workspaceId)) throw new Error("Invalid workspace identifier for durable learning queue.");
  return new DeferredCandidateReviewQueueService(new FileDeferredCandidateRegistry(resolve(process.cwd(), "data", "noesis-learning", workspaceId, "deferred-candidates.jsonl")));
}

/** Resolution provenance uses the same workspace isolation as the deferred queue. */
export function createDeferredCandidateResolutionLedger(workspaceId: string) {
  if (!workspaceIdPattern.test(workspaceId)) throw new Error("Invalid workspace identifier for durable learning queue.");
  return new FileDeferredCandidateResolutionLedger(resolve(process.cwd(), "data", "noesis-learning", workspaceId, "deferred-candidate-resolutions.jsonl"));
}
