import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  compareExpectedVsActual,
  computeOutcomeVarianceHash,
  getExpectedVsActualComparatorFoundation,
  replayExpectedVsActual,
} from "@/services/expected-vs-actual-comparator";
import type { ComparatorInput, ComparatorResult } from "@/types/expected-vs-actual-comparator";

export async function requireExpectedVsActualComparatorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getExpectedVsActualComparatorContractResponse() {
  return getExpectedVsActualComparatorFoundation();
}

export async function compareExpectedVsActualRequest(request: Request) {
  const body = await readBody(request) as ComparatorInput;
  return compareExpectedVsActual(body);
}

export async function validateExpectedVsActualRequest(request: Request) {
  const body = await readBody(request) as Partial<ComparatorResult> & ComparatorInput;
  const result = body.variances ? body as ComparatorResult : compareExpectedVsActual(body);
  return {
    validation: result.validation,
    variance_hashes: result.variances.map((variance) => computeOutcomeVarianceHash(variance)),
    replay_valid: replayExpectedVsActual(result),
  };
}

export async function replayExpectedVsActualRequest(request: Request) {
  const body = await readBody(request) as Partial<ComparatorResult> & ComparatorInput;
  const result = body.variances ? body as ComparatorResult : compareExpectedVsActual(body);
  return {
    replay_valid: replayExpectedVsActual(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function varianceExpectedVsActualRequest(request: Request) {
  const body = await readBody(request) as ComparatorInput;
  const result = compareExpectedVsActual(body);
  return {
    variances: result.variances,
    alignment: result.alignment,
  };
}

export async function inspectExpectedVsActualRequest(request?: Request) {
  if (!request) return getExpectedVsActualComparatorFoundation();
  const body = await readBody(request) as ComparatorInput;
  const result = compareExpectedVsActual(body);
  return {
    status: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    domains: result.variances.map((variance) => variance.comparison_domain),
    advisory_only: result.advisory_only,
  };
}
