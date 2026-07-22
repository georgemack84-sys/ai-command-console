import {
  buildExplainabilityCertificationObservabilitySurface,
  generateExplainabilityCertificationReport,
  getExplainabilityCertificationGateContract,
  replayExplainabilityCertification,
  runExplainabilityCertification,
  validateExplanationCertification,
  validateExplanationReplay,
} from "@/services/explainability-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ExplainabilityCertificationInput, ExplainabilityCertificationLedger } from "@/types/explainability-certification-gate";

export async function requireExplainabilityCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): ExplainabilityCertificationLedger {
  return (body.ledger as ExplainabilityCertificationLedger | undefined) ?? runExplainabilityCertification(body as ExplainabilityCertificationInput);
}

export function contractResponse() { return getExplainabilityCertificationGateContract(); }
export async function runRequest(request: Request) { return runExplainabilityCertification((await readBody(request)) as ExplainabilityCertificationInput); }
export async function validateExplanationRequest(request: Request) { return validateExplanationCertification(ledgerFromBody(await readBody(request))); }
export async function validateReplayRequest(request: Request) { return validateExplanationReplay(ledgerFromBody(await readBody(request))); }
export async function reportRequest(request: Request) {
  const body = await readBody(request);
  return body.ledger ? ledgerFromBody(body).reports[0] : generateExplainabilityCertificationReport(body as ExplainabilityCertificationInput);
}
export async function replayRequest(request: Request) { return replayExplainabilityCertification(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildExplainabilityCertificationObservabilitySurface();
  return buildExplainabilityCertificationObservabilitySurface(ledgerFromBody(await readBody(request)));
}
