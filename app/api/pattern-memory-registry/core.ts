import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishPatternMemoryRegistry,
  getPatternMemoryRegistry,
  replayPatternMemoryRegistry,
} from "@/services/pattern-memory-registry";
import type { PatternMemoryRegistryInput, PatternMemoryRegistryResult } from "@/types/pattern-memory-registry";

export async function requirePatternMemoryRegistryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getPatternMemoryRegistry();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as PatternMemoryRegistryInput;
  return establishPatternMemoryRegistry(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as PatternMemoryRegistryInput;
  return establishPatternMemoryRegistry(body).pattern_records;
}

export async function qualificationRequest(request: Request) {
  const body = (await readBody(request)) as PatternMemoryRegistryInput;
  return establishPatternMemoryRegistry(body).qualification_report;
}

export async function similarityRequest(request: Request) {
  const body = (await readBody(request)) as PatternMemoryRegistryInput;
  return establishPatternMemoryRegistry(body).similarity_catalog;
}

export async function versionsRequest(request: Request) {
  const body = (await readBody(request)) as PatternMemoryRegistryInput;
  return establishPatternMemoryRegistry(body).version_history;
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as PatternMemoryRegistryInput;
  return establishPatternMemoryRegistry(body).pattern_ledger;
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as PatternMemoryRegistryInput;
  return establishPatternMemoryRegistry(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<PatternMemoryRegistryResult> & PatternMemoryRegistryInput;
  const result = body.contract && body.metrics ? (body as PatternMemoryRegistryResult) : establishPatternMemoryRegistry(body);
  return {
    replay_valid: replayPatternMemoryRegistry(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getPatternMemoryRegistry();
  const body = (await readBody(request)) as PatternMemoryRegistryInput;
  const result = establishPatternMemoryRegistry(body);
  return {
    status: result.status,
    failures: result.failures,
    registered_patterns: result.metrics.registered_patterns,
    qualification_success_rate: result.metrics.qualification_success_rate,
    similarity_calculations: result.metrics.similarity_calculations,
    version_growth: result.metrics.version_growth,
    deterministic: result.deterministic,
    replayable: result.replayable,
    governed: result.governed,
    tenant_isolated: result.tenant_isolated,
    immutable_history: result.immutable_history,
    reuse_governed: result.reuse_governed,
    authoritative_pattern_registry: result.authoritative_pattern_registry,
    predictive_truth_supported: result.predictive_truth_supported,
    execution_logic_supported: result.execution_logic_supported,
  };
}
