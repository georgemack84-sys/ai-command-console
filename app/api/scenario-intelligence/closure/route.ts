import { apiError, apiSuccess } from "@/src/server/api/response";
import { closureRequest, requireScenarioIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScenarioIntelligenceUser(); return apiSuccess(await closureRequest()); } catch (error) { return apiError(error, "Unable to inspect scenario closure."); } }
export async function POST(request: Request) { try { await requireScenarioIntelligenceUser(); return apiSuccess(await closureRequest(request)); } catch (error) { return apiError(error, "Unable to inspect scenario closure."); } }
