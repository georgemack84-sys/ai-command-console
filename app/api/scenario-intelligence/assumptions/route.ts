import { apiError, apiSuccess } from "@/src/server/api/response";
import { assumptionsRequest, requireScenarioIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScenarioIntelligenceUser(); return apiSuccess(await assumptionsRequest()); } catch (error) { return apiError(error, "Unable to inspect scenario assumptions."); } }
export async function POST(request: Request) { try { await requireScenarioIntelligenceUser(); return apiSuccess(await assumptionsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect scenario assumptions."); } }
