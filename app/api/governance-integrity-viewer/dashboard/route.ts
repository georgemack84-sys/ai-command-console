import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityViewerUser, viewForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceIntegrityViewerUser(); const view = viewForRequest(request); return apiSuccess({ integrity_state: view.integrity_state, certification_state: view.certification_state, chain_continuity: view.chain_continuity, chain_completeness: view.chain_completeness, protected_record_count: view.protected_record_count, trust_indicators: view.trust_indicators }); } catch (error) { return apiError(error, "Unable to retrieve governance integrity dashboard."); } }
