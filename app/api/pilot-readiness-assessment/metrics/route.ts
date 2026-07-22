import { metricsRequest, requirePilotReadinessAssessmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await metricsRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Readiness metrics."); } }
export async function POST(request: Request) { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await metricsRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Readiness metrics."); } }
