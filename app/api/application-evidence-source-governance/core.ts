import {
  getApplicationEvidenceSourceGovernanceBundle,
  runApplicationEvidenceSourceGovernance,
  validateApplicationEvidenceSourceGovernance,
} from "@/services/application-evidence-source-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationEvidenceInput, ApplicationEvidenceSourceGovernanceResult } from "@/types/application-evidence-source-governance";

export async function requireApplicationEvidenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationEvidenceInput { return body as ApplicationEvidenceInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationEvidenceSourceGovernanceResult { return (body.result as ApplicationEvidenceSourceGovernanceResult | undefined) ?? runApplicationEvidenceSourceGovernance(inputFromBody(body)); }

export function contractResponse() { return getApplicationEvidenceSourceGovernanceBundle(); }
export async function validateRequest(request: Request) { return validateApplicationEvidenceSourceGovernance(resultFromBody(await readBody(request))); }
export async function boundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { boundary: result.boundary }; }
export async function indexRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { evidence_index: result.evidence_index }; }
export async function referencesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { reference_catalog: result.reference_catalog }; }
export async function sourcesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { source_registry: result.source_registry }; }
export async function sourceGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { source_governance: result.source_governance }; }
export async function provenanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { provenance_view: result.provenance_view }; }
export async function viewsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { evidence_views: result.evidence_views }; }
export async function discoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { discovery: result.discovery }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { governance_integration: result.governance_integration }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationEvidenceSourceGovernance(); return { qualification: result.qualification, certification: result.certification, integrity_hash: result.integrity_hash }; }
