import { requireIncidentExceptionGovernanceUser, timelineRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await timelineRequest()); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance timeline."); } }
export async function POST(request: Request) { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await timelineRequest(request)); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance timeline."); } }
