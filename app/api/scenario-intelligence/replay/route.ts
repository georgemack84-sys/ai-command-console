import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireScenarioIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScenarioIntelligenceUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay scenario construction."); } }
export async function POST(request: Request) { try { await requireScenarioIntelligenceUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay scenario construction."); } }
