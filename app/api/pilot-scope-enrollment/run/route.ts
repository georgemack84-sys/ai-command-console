import { requirePilotScopeEnrollmentUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Pilot Scope Enrollment."); } }
export async function POST(request: Request) { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Pilot Scope Enrollment."); } }
