import { buildDependencyInjectionGraphs, buildStressInjectionObservabilitySurface, getStressInjectionContract, replayStressInjection, runStressInjection, scheduleStressEvents, sequenceFaults, validateStressInjection } from "@/services/stress-injection-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StressInjectionInput, StressInjectionLedger } from "@/types/stress-injection-engine";

export async function requireStressInjectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): StressInjectionLedger {
  return (body.ledger as StressInjectionLedger | undefined) ?? runStressInjection(body as StressInjectionInput);
}

export function contractResponse() { return getStressInjectionContract(); }
export async function injectRequest(request: Request) { return runStressInjection((await readBody(request)) as StressInjectionInput); }
export async function scheduleRequest(request: Request) { return scheduleStressEvents((await readBody(request)) as StressInjectionInput); }
export async function sequenceRequest(request: Request) { return sequenceFaults((await readBody(request)) as StressInjectionInput); }
export async function dependenciesRequest(request: Request) { return buildDependencyInjectionGraphs((await readBody(request)) as StressInjectionInput); }
export async function replayRequest(request: Request) { return replayStressInjection(ledgerFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateStressInjection(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildStressInjectionObservabilitySurface();
  return buildStressInjectionObservabilitySurface(ledgerFromBody(await readBody(request)));
}
