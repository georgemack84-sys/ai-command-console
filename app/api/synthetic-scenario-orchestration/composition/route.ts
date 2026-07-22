import { apiError, apiSuccess } from "@/src/server/api/response";
import { compositionRequest, requireSyntheticScenarioOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await compositionRequest()); } catch (error) { return apiError(error, "Unable to load synthetic scenario composition."); } }
export async function POST(request: Request) { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await compositionRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic scenario composition."); } }
