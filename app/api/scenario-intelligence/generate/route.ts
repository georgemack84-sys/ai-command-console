import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRequest, requireScenarioIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScenarioIntelligenceUser(); return apiSuccess(await generateRequest()); } catch (error) { return apiError(error, "Unable to generate scenarios."); } }
export async function POST(request: Request) { try { await requireScenarioIntelligenceUser(); return apiSuccess(await generateRequest(request)); } catch (error) { return apiError(error, "Unable to generate scenarios."); } }
