import {
  buildAutonomousKnowledgeCertificationDashboard,
  certifyAutonomousKnowledgeEvolution,
  getAutonomousKnowledgeEvolutionCertificationGate,
  listAutonomousKnowledgeCertificationFailures,
  listAutonomousKnowledgeCertificationLedger,
  listAutonomousKnowledgeCertificationMatrix,
  listAutonomousKnowledgeCertificationReports,
  validateAutonomousKnowledgeCertification,
} from "@/services/autonomous-knowledge-evolution-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AutonomousKnowledgeCertificationInput, AutonomousKnowledgeCertificationRecord } from "@/types/autonomous-knowledge-evolution-certification-gate";

export async function requireAutonomousKnowledgeCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function certificationFromBody(body: Record<string, unknown>): AutonomousKnowledgeCertificationRecord {
  return (body.certification as AutonomousKnowledgeCertificationRecord | undefined) ?? certifyAutonomousKnowledgeEvolution(body as AutonomousKnowledgeCertificationInput);
}

export function contractResponse() { return getAutonomousKnowledgeEvolutionCertificationGate(); }
export async function certifyRequest(request: Request) { return certifyAutonomousKnowledgeEvolution((await readBody(request)) as AutonomousKnowledgeCertificationInput); }
export async function matrixRequest(request: Request) { return listAutonomousKnowledgeCertificationMatrix((await readBody(request)) as AutonomousKnowledgeCertificationInput); }
export async function failuresRequest(request: Request) { return listAutonomousKnowledgeCertificationFailures((await readBody(request)) as AutonomousKnowledgeCertificationInput); }
export async function reportsRequest(request: Request) { return listAutonomousKnowledgeCertificationReports((await readBody(request)) as AutonomousKnowledgeCertificationInput); }
export async function ledgerRequest(request: Request) { return listAutonomousKnowledgeCertificationLedger((await readBody(request)) as AutonomousKnowledgeCertificationInput); }
export async function dashboardRequest(request: Request) { return buildAutonomousKnowledgeCertificationDashboard((await readBody(request)) as AutonomousKnowledgeCertificationInput); }
export async function validateRequest(request: Request) { return validateAutonomousKnowledgeCertification(certificationFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildAutonomousKnowledgeCertificationDashboard();
  return buildAutonomousKnowledgeCertificationDashboard((await readBody(request)) as AutonomousKnowledgeCertificationInput);
}
