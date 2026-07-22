import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustDriftUser, rootCauseRequest } from "../../trust-drift-detection/core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustDriftUser(); return apiSuccess(await rootCauseRequest()); } catch (error) { return apiError(error, "Unable to load Trust Drift root cause analysis."); } }
export async function POST(request: Request) { try { await requireTrustDriftUser(); return apiSuccess(await rootCauseRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Drift root cause analysis."); } }
