import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireRetrievalIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to retrieve retrieval intelligence observability."); } }
export async function POST(request: Request) { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect retrieval intelligence observability."); } }
