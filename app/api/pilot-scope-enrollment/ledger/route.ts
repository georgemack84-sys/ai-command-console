import { ledgerRequest, requirePilotScopeEnrollmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment ledger."); } }
export async function POST(request: Request) { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment ledger."); } }
