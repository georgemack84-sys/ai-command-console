import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationEvidenceUser, sourceGovernanceRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(await sourceGovernanceRequest()); } catch (error) { return apiError(error, "Unable to inspect source governance."); } }
export async function POST(request: Request) { try { await requireApplicationEvidenceUser(); return apiSuccess(await sourceGovernanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect source governance."); } }
