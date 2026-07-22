import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  appendRecommendationPerformanceRecord,
  computeRecommendationPerformanceRecordHash,
  getRecommendationPerformanceLedgerFoundation,
  replayRecommendationPerformanceLedger,
} from "@/services/recommendation-performance-ledger";
import type { RecommendationPerformanceLedgerInput, RecommendationPerformanceLedgerResult } from "@/types/recommendation-performance-ledger";

export async function requireRecommendationPerformanceLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationPerformanceLedgerContractResponse() {
  return getRecommendationPerformanceLedgerFoundation();
}

export async function appendRecommendationPerformanceLedgerRequest(request: Request) {
  const body = await readBody(request) as RecommendationPerformanceLedgerInput;
  return appendRecommendationPerformanceRecord(body);
}

export async function readRecommendationPerformanceLedgerRequest(request: Request) {
  const body = await readBody(request) as RecommendationPerformanceLedgerInput;
  const result = appendRecommendationPerformanceRecord(body);
  return {
    performance_record: result.performance_record,
    read_only: result.historical_registry.read_only,
    read_operations_mutate_state: result.validation.read_operations_mutate_state,
  };
}

export async function registryRecommendationPerformanceLedgerRequest(request: Request) {
  const body = await readBody(request) as RecommendationPerformanceLedgerInput;
  return appendRecommendationPerformanceRecord(body).historical_registry;
}

export async function lineageRecommendationPerformanceLedgerRequest(request: Request) {
  const body = await readBody(request) as RecommendationPerformanceLedgerInput;
  return appendRecommendationPerformanceRecord(body).lineage_graph;
}

export async function integrityRecommendationPerformanceLedgerRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationPerformanceLedgerResult> & RecommendationPerformanceLedgerInput;
  const result = body.performance_record ? body as RecommendationPerformanceLedgerResult : appendRecommendationPerformanceRecord(body);
  return {
    validation: result.validation,
    performance_record_hash: computeRecommendationPerformanceRecordHash(result.performance_record),
    replay_valid: replayRecommendationPerformanceLedger(result),
  };
}

export async function replayRecommendationPerformanceLedgerRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationPerformanceLedgerResult> & RecommendationPerformanceLedgerInput;
  const result = body.performance_record ? body as RecommendationPerformanceLedgerResult : appendRecommendationPerformanceRecord(body);
  return {
    replay_valid: replayRecommendationPerformanceLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectRecommendationPerformanceLedgerRequest(request?: Request) {
  if (!request) return getRecommendationPerformanceLedgerFoundation();
  const body = await readBody(request) as RecommendationPerformanceLedgerInput;
  const result = appendRecommendationPerformanceRecord(body);
  return {
    status: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    performance_record_id: result.performance_record.performance_record_id,
    lineage_edges: result.lineage_graph.edges.length,
    append_only: result.append_only,
    immutable: result.immutable,
  };
}
