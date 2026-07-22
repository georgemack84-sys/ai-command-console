import {
  buildContinuousOptimizationCertificationObservabilitySurface,
  getContinuousOptimizationCertificationDecision,
  getContinuousOptimizationCertificationGate,
  listContinuousOptimizationCertificationEvidence,
  listContinuousOptimizationCertificationTests,
  runContinuousOptimizationCertification,
  validateContinuousOptimizationCertification,
} from "@/services/continuous-optimization-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousOptimizationCertificationInput, ContinuousOptimizationCertificationLedger } from "@/types/continuous-optimization-certification-gate";

export async function requireContinuousOptimizationCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): ContinuousOptimizationCertificationLedger {
  return (body.ledger as ContinuousOptimizationCertificationLedger | undefined) ?? runContinuousOptimizationCertification(body as ContinuousOptimizationCertificationInput);
}

export function contractResponse() { return getContinuousOptimizationCertificationGate(); }
export async function certifyRequest(request: Request) { return runContinuousOptimizationCertification((await readBody(request)) as ContinuousOptimizationCertificationInput); }
export async function testsRequest(request: Request) { return listContinuousOptimizationCertificationTests((await readBody(request)) as ContinuousOptimizationCertificationInput); }
export async function evidenceRequest(request: Request) { return listContinuousOptimizationCertificationEvidence((await readBody(request)) as ContinuousOptimizationCertificationInput); }
export async function decisionRequest(request: Request) { return getContinuousOptimizationCertificationDecision((await readBody(request)) as ContinuousOptimizationCertificationInput); }
export async function validateRequest(request: Request) { return validateContinuousOptimizationCertification(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildContinuousOptimizationCertificationObservabilitySurface();
  return buildContinuousOptimizationCertificationObservabilitySurface(ledgerFromBody(await readBody(request)));
}
