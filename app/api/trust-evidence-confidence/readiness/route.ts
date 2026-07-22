import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustEvidenceConfidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Trust Evidence & Confidence readiness."); } }
export async function POST(request: Request) { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to project Trust Evidence & Confidence readiness."); } }
