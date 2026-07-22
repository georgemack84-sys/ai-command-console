import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationRequest, requireTrustEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvaluationUser(); return apiSuccess(await explanationRequest()); } catch (error) { return apiError(error, "Unable to inspect evaluation explanation and replay package."); } }
export async function POST(request: Request) { try { await requireTrustEvaluationUser(); return apiSuccess(await explanationRequest(request)); } catch (error) { return apiError(error, "Unable to project evaluation explanation and replay package."); } }
