import { requireIncidentExceptionGovernanceUser, rootCauseRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await rootCauseRequest()); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance root cause."); } }
export async function POST(request: Request) { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await rootCauseRequest(request)); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance root cause."); } }
