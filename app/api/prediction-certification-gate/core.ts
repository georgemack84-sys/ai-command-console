import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPredictionCertificationObservabilitySurface,
  getPredictionCertificationGateContract,
  replayPredictionCertification,
  runPredictionCertification,
  validatePredictionCertification,
} from "@/services/prediction-certification-gate";
import type { PredictionCertificationInput, PredictionCertificationLedger } from "@/types/prediction-certification-gate";

export async function requirePredictionCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PredictionCertificationInput {
  return body as PredictionCertificationInput;
}

function ledgerFromBody(body: Record<string, unknown>): PredictionCertificationLedger {
  return (body.ledger as PredictionCertificationLedger | undefined) ?? runPredictionCertification(inputFromBody(body));
}

export function contractResponse() { return getPredictionCertificationGateContract(); }
export async function certifyRequest(request: Request) { return runPredictionCertification(inputFromBody(await readBody(request))); }
export async function ledgerRequest(request: Request) { return ledgerFromBody(await readBody(request)); }
export async function reportRequest(request: Request) { return ledgerFromBody(await readBody(request)).certification_results[0]; }
export async function evidenceRequest(request: Request) {
  const ledger = ledgerFromBody(await readBody(request));
  return { validation_evidence: ledger.validation_evidence, integrity_verification: ledger.integrity_verification, lineage_references: ledger.lineage_references, replay_references: ledger.replay_references };
}
export async function replayRequest(request: Request) { return replayPredictionCertification(ledgerFromBody(await readBody(request))); }
export async function governanceRequest(request: Request) { return ledgerFromBody(await readBody(request)).certification_results[0].governance_validation; }
export async function constitutionalRequest(request: Request) { return ledgerFromBody(await readBody(request)).certification_results[0].constitutional_validation; }
export async function securityRequest(request: Request) { return ledgerFromBody(await readBody(request)).certification_results[0].security_validation; }
export async function operationalRequest(request: Request) { return ledgerFromBody(await readBody(request)).certification_results[0].operational_validation; }
export async function validateRequest(request: Request) { return validatePredictionCertification(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildPredictionCertificationObservabilitySurface();
  return buildPredictionCertificationObservabilitySurface(ledgerFromBody(await readBody(request)));
}
