import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requireTrustEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvaluationUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to inspect trust decision."); } }
export async function POST(request: Request) { try { await requireTrustEvaluationUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to project trust decision."); } }
