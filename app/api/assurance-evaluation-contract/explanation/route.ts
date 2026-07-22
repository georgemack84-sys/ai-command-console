import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationRequest, requireAssuranceEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceEvaluationUser(); return apiSuccess(await explanationRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation explanation."); } }
export async function POST(request: Request) { try { await requireAssuranceEvaluationUser(); return apiSuccess(await explanationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation explanation."); } }
