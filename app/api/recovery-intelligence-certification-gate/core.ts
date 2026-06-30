import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecoveryCertificationObservabilitySurface,
  getRecoveryIntelligenceCertificationGateContract,
  runRecoveryIntelligenceCertification,
  validateRecoveryIntelligenceCertification,
} from "@/services/recovery-intelligence-certification-gate";
import type { RecoveryCertificationInput, RecoveryIntelligenceCertificationRecord } from "@/types/recovery-intelligence-certification-gate";

export async function requireRecoveryCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RecoveryCertificationInput {
  return body as RecoveryCertificationInput;
}

function recordFromBody(body: Record<string, unknown>): RecoveryIntelligenceCertificationRecord {
  return (body.certification as RecoveryIntelligenceCertificationRecord | undefined) ?? runRecoveryIntelligenceCertification(inputFromBody(body));
}

export function contractResponse() { return getRecoveryIntelligenceCertificationGateContract(); }
export async function certifyRequest(request: Request) { return runRecoveryIntelligenceCertification(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRecoveryIntelligenceCertification(recordFromBody(await readBody(request))); }
export async function reportRequest(request: Request) { return recordFromBody(await readBody(request)).certification_report; }
export async function evidenceRequest(request: Request) {
  const record = recordFromBody(await readBody(request));
  return {
    certification_id: record.certification_id,
    executed_tests: record.executed_tests,
    ledger_entry: record.ledger_entry,
    replay_reference: record.replay_reference,
    lineage_reference: record.lineage_reference,
    integrity_hash: record.integrity_hash,
  };
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildRecoveryCertificationObservabilitySurface();
  return buildRecoveryCertificationObservabilitySurface(recordFromBody(await readBody(request)));
}
