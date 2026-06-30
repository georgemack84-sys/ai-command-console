import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildTruthLedgerCertificationContract,
  runTruthLedgerCertification,
} from "@/services/truth-ledger-certification";

export async function requireTruthLedgerCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readTruthLedgerCertificationParams(request: Request) {
  const url = new URL(request.url);
  return {
    certification_id: String(url.searchParams.get("certificationId") || "truth_ledger_cert_6l_000001"),
    tenant_scope: String(url.searchParams.get("tenantId") || "tenant_alpha"),
    mission_scope: String(url.searchParams.get("missionId") || "mission_query_layer"),
  };
}

export function getTruthLedgerContractForRequest(request: Request) {
  return buildTruthLedgerCertificationContract(readTruthLedgerCertificationParams(request));
}

export function getTruthLedgerCertificationForRequest(request: Request, certificationId?: string) {
  const params = readTruthLedgerCertificationParams(request);
  return runTruthLedgerCertification(buildTruthLedgerCertificationContract({
    ...params,
    certification_id: certificationId ?? params.certification_id,
  }));
}

export async function readTruthLedgerCertificationRun(request: Request) {
  const body = await request.json().catch(() => ({}));
  return runTruthLedgerCertification(buildTruthLedgerCertificationContract({
    certification_id: String(body.certification_id || "truth_ledger_cert_6l_000001"),
    tenant_scope: String(body.tenant_id || "tenant_alpha"),
    mission_scope: String(body.mission_id || "mission_query_layer"),
  }));
}
