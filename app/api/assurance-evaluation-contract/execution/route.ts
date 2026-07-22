import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionRequest, requireAssuranceEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceEvaluationUser(); return apiSuccess(await executionRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation execution."); } }
export async function POST(request: Request) { try { await requireAssuranceEvaluationUser(); return apiSuccess(await executionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation execution."); } }
