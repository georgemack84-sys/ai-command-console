import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireSyntheticScenarioOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to load synthetic scenario lineage."); } }
export async function POST(request: Request) { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic scenario lineage."); } }
