import { evidenceRequest, requireContinuousMonitoringIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read monitoring evidence."); } }
export async function POST(request: Request) { try { await requireContinuousMonitoringIntelligenceUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read monitoring evidence."); } }
