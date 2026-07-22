import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireTrustEvidenceConfidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect confidence governance and observability."); } }
export async function POST(request: Request) { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to project confidence governance and observability."); } }
