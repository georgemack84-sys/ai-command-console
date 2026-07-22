import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSyntheticScenarioOrchestrationUser, scheduleRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await scheduleRequest()); } catch (error) { return apiError(error, "Unable to load synthetic scenario schedule."); } }
export async function POST(request: Request) { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await scheduleRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic scenario schedule."); } }
