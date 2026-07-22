import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireSyntheticScenarioOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load synthetic scenario registry."); } }
export async function POST(request: Request) { try { await requireSyntheticScenarioOrchestrationUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic scenario registry."); } }
