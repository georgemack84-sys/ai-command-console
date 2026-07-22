import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireTrustEvidenceConfidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to inspect evidence lineage and confidence report."); } }
export async function POST(request: Request) { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to project evidence lineage and confidence report."); } }
