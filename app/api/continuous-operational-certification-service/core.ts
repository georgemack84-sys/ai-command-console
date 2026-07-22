import { getContinuousOperationalCertificationServiceBundle, runContinuousOperationalCertificationService, validateContinuousOperationalCertificationService } from "@/services/continuous-operational-certification-service";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousOperationalCertificationInput, ContinuousOperationalCertificationResult } from "@/types/continuous-operational-certification-service";

export async function requireContinuousOperationalCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousOperationalCertificationInput { return body as ContinuousOperationalCertificationInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousOperationalCertificationResult { return (body.result as ContinuousOperationalCertificationResult | undefined) ?? runContinuousOperationalCertificationService(inputFromBody(body)); }

export function contractResponse() { return getContinuousOperationalCertificationServiceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { certification_engine: result.certification_engine }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { health_monitor: result.health_monitor, observability: result.observability }; }
export async function driftRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { drift_detector: result.drift_detector }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { evidence_collector: result.evidence_collector }; }
export async function attestationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { attestation_validator: result.attestation_validator }; }
export async function changesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { change_processor: result.change_processor }; }
export async function eventsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { event_registry: result.event_registry, lineage_manager: result.lineage_manager }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { ledger: result.ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { replay_service: result.replay_service }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOperationalCertificationService(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousOperationalCertificationService(resultFromBody(await readBody(request))); }
