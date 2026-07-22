import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvaluationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Trust Evaluation Engine contract."); } }
