import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualityRequest, requireTrustEvidenceConfidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await qualityRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence quality model."); } }
export async function POST(request: Request) { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await qualityRequest(request)); } catch (error) { return apiError(error, "Unable to project evidence quality model."); } }
