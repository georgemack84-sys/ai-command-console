import { intelligenceRequest, requireContinuousMonitoringIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await intelligenceRequest()); } catch (error) { return apiError(error, "Unable to read operational intelligence."); } }
export async function POST(request: Request) { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await intelligenceRequest(request)); } catch (error) { return apiError(error, "Unable to read operational intelligence."); } }
