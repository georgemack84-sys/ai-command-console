import { contractResponse, requireContinuousMonitoringIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Continuous Monitoring Intelligence contract."); } }
