import {
  buildHistoricalMaturityEvolution,
  buildHistoricalMaturityObservabilitySurface,
  getHistoricalMaturityEvolutionBundle,
  getHistoricalMaturityReport,
  getHistoricalMaturityTrends,
  listHistoricalMaturityLedger,
  listHistoricalMaturityTimeline,
  validateHistoricalMaturityEvolution,
} from "@/services/historical-maturity-evolution";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { HistoricalMaturityInput, HistoricalMaturityRepository } from "@/types/historical-maturity-evolution";

export async function requireHistoricalMaturityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): HistoricalMaturityRepository {
  return (body.repository as HistoricalMaturityRepository | undefined) ?? buildHistoricalMaturityEvolution(body as HistoricalMaturityInput);
}

export function historicalBundleResponse() { return getHistoricalMaturityEvolutionBundle(); }
export async function historyRequest(request: Request) { return buildHistoricalMaturityEvolution((await readBody(request)) as HistoricalMaturityInput); }
export async function timelineRequest(request: Request) { return listHistoricalMaturityTimeline((await readBody(request)) as HistoricalMaturityInput); }
export async function trendsRequest(request: Request) { return getHistoricalMaturityTrends((await readBody(request)) as HistoricalMaturityInput); }
export async function reportRequest(request: Request) { return getHistoricalMaturityReport((await readBody(request)) as HistoricalMaturityInput); }
export async function ledgerRequest(request: Request) { return listHistoricalMaturityLedger((await readBody(request)) as HistoricalMaturityInput); }
export async function validateRequest(request: Request) { return validateHistoricalMaturityEvolution(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildHistoricalMaturityObservabilitySurface();
  return buildHistoricalMaturityObservabilitySurface(repositoryFromBody(await readBody(request)));
}
