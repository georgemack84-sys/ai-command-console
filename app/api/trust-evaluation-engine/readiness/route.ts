import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvaluationUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Trust Evaluation Engine readiness."); } }
export async function POST(request: Request) { try { await requireTrustEvaluationUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to project Trust Evaluation Engine readiness."); } }
