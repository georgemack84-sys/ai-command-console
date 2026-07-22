import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAssuranceEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceEvaluationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation contract."); } }
