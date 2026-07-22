import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireRetrievalIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect retrieval intelligence engine."); } }
export async function POST(request: Request) { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to run retrieval intelligence engine."); } }
