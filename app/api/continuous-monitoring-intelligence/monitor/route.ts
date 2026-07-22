import { monitorRequest, requireContinuousMonitoringIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await monitorRequest()); } catch (error) { return apiError(error, "Unable to read operations monitor."); } }
export async function POST(request: Request) { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await monitorRequest(request)); } catch (error) { return apiError(error, "Unable to read operations monitor."); } }
