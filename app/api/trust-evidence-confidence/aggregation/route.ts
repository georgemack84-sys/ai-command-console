import { aggregationRequest, requireTrustEvidenceConfidenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await aggregationRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence aggregation."); } }
export async function POST(request: Request) { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await aggregationRequest(request)); } catch (error) { return apiError(error, "Unable to project evidence aggregation."); } }
