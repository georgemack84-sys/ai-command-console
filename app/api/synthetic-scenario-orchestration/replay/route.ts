import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireSyntheticScenarioOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load synthetic scenario replay."); } }
export async function POST(request: Request) { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic scenario replay."); } }
