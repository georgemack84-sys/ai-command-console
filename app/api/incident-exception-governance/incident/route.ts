import { incidentRequest, requireIncidentExceptionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await incidentRequest()); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance incident."); } }
export async function POST(request: Request) { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await incidentRequest(request)); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance incident."); } }
