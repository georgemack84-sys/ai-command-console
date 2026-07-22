import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionRequest, requireSyntheticScenarioOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await executionRequest()); } catch (error) { return apiError(error, "Unable to load synthetic scenario execution."); } }
export async function POST(request: Request) { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await executionRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic scenario execution."); } }
