import { healthRequest, requireContinuousMonitoringIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await healthRequest()); } catch (error) { return apiError(error, "Unable to read platform health intelligence."); } }
export async function POST(request: Request) { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await healthRequest(request)); } catch (error) { return apiError(error, "Unable to read platform health intelligence."); } }
