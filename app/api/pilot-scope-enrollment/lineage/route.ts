import { lineageRequest, requirePilotScopeEnrollmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment lineage."); } }
export async function POST(request: Request) { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment lineage."); } }
