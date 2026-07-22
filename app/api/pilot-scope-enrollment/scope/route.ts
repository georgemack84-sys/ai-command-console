import { requirePilotScopeEnrollmentUser, scopeRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await scopeRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment scope."); } }
export async function POST(request: Request) { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await scopeRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment scope."); } }
