import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustEvaluationUser, standingRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvaluationUser(); return apiSuccess(await standingRequest()); } catch (error) { return apiError(error, "Unable to inspect trust standing."); } }
export async function POST(request: Request) { try { await requireTrustEvaluationUser(); return apiSuccess(await standingRequest(request)); } catch (error) { return apiError(error, "Unable to project trust standing."); } }
