import { changesRequest, requireContinuousMonitoringIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await changesRequest()); } catch (error) { return apiError(error, "Unable to read operational changes."); } }
export async function POST(request: Request) { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await changesRequest(request)); } catch (error) { return apiError(error, "Unable to read operational changes."); } }
