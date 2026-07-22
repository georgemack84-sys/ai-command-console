import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustEvidenceConfidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Trust Evidence & Confidence contract."); } }
