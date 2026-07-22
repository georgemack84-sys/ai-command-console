import { buildScenarioStressCertificationObservabilitySurface, getScenarioStressCertificationContract, replayScenarioStressCertification, runScenarioStressCertification, validateScenarioStressCertification } from "@/services/scenario-stress-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ScenarioStressCertificationInput, ScenarioStressCertificationLedger } from "@/types/scenario-stress-certification-gate";

export async function requireScenarioStressCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): ScenarioStressCertificationLedger {
  return (body.ledger as ScenarioStressCertificationLedger | undefined) ?? runScenarioStressCertification(body as ScenarioStressCertificationInput);
}

export function contractResponse() { return getScenarioStressCertificationContract(); }
export async function runRequest(request: Request) { return runScenarioStressCertification((await readBody(request)) as ScenarioStressCertificationInput); }
export async function reportRequest(request: Request) { return ledgerFromBody(await readBody(request)).reports[0]; }
export async function evidenceRequest(request: Request) {
  const ledger = ledgerFromBody(await readBody(request));
  return { validation_evidence: ledger.validation_evidence, replay_references: ledger.replay_references, lineage_references: ledger.lineage_references, integrity_verification: ledger.integrity_verification };
}
export async function replayRequest(request: Request) { return replayScenarioStressCertification(ledgerFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateScenarioStressCertification(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildScenarioStressCertificationObservabilitySurface();
  return buildScenarioStressCertificationObservabilitySurface(ledgerFromBody(await readBody(request)));
}
