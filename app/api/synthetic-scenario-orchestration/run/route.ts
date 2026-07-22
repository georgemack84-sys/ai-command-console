import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSyntheticScenarioOrchestrationUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run synthetic scenario orchestration."); } }
export async function POST(request: Request) { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run synthetic scenario orchestration."); } }
