import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireTrustEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvaluationUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to inspect trust evaluation observability."); } }
export async function POST(request: Request) { try { await requireTrustEvaluationUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to project trust evaluation observability."); } }
