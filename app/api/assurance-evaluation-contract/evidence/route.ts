import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireAssuranceEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceEvaluationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance evidence qualification."); } }
export async function POST(request: Request) { try { await requireAssuranceEvaluationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance evidence qualification."); } }
