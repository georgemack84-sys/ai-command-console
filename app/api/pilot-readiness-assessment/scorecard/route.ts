import { requirePilotReadinessAssessmentUser, scorecardRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await scorecardRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Readiness scorecard."); } }
export async function POST(request: Request) { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await scorecardRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Readiness scorecard."); } }
