import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceCertificationOrchestratorUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceCertificationOrchestratorUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve governance certification orchestrator contract."); } }
