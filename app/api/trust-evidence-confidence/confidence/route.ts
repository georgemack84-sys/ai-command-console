import { apiError, apiSuccess } from "@/src/server/api/response";
import { confidenceRequest, requireTrustEvidenceConfidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await confidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect confidence computation."); } }
export async function POST(request: Request) { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await confidenceRequest(request)); } catch (error) { return apiError(error, "Unable to project confidence computation."); } }
