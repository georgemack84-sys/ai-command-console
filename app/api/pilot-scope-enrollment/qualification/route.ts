import { qualificationRequest, requirePilotScopeEnrollmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment qualification."); } }
export async function POST(request: Request) { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment qualification."); } }
