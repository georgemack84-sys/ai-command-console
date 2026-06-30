import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceVisibilityCertificationUser, reportForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceVisibilityCertificationUser(); const report = reportForRequest(request); return apiSuccess({ certification_id: report.certification_id, evidence_hash: report.evidence_package.evidence_hash, report_hash: report.report_hash }); } catch (error) { return apiError(error, "Unable to hash governance visibility certification."); } }
