import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceCertificationOrchestratorUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceCertificationOrchestratorUser(); return apiSuccess(reportForRequest(request)); } catch (error) { return apiError(error, "Unable to run governance certification orchestrator."); } }
