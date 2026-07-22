import { requireContinuousMonitoringIntelligenceUser, validateRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function POST(request: Request) { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Continuous Monitoring Intelligence."); } }
