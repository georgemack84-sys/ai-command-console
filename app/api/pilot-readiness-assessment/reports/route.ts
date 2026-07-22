import { reportsRequest, requirePilotReadinessAssessmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await reportsRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Readiness reports."); } }
export async function POST(request: Request) { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await reportsRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Readiness reports."); } }
