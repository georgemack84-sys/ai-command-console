import { decisionRequest, requirePilotReadinessAssessmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Readiness decision."); } }
export async function POST(request: Request) { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Readiness decision."); } }
