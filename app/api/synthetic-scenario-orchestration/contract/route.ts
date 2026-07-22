import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSyntheticScenarioOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load synthetic scenario orchestration contract."); } }
