import { apiError, apiSuccess } from "@/src/server/api/response";
import { inputsRequest, requireAssuranceEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceEvaluationUser(); return apiSuccess(await inputsRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation inputs."); } }
export async function POST(request: Request) { try { await requireAssuranceEvaluationUser(); return apiSuccess(await inputsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation inputs."); } }
