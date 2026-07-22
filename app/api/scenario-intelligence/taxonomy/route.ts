import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireScenarioIntelligenceUser, taxonomyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScenarioIntelligenceUser(); return apiSuccess(await taxonomyRequest()); } catch (error) { return apiError(error, "Unable to inspect scenario taxonomy."); } }
export async function POST(request: Request) { try { await requireScenarioIntelligenceUser(); return apiSuccess(await taxonomyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect scenario taxonomy."); } }
