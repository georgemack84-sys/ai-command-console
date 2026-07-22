import { contractResponse, requireIncidentExceptionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance contract."); } }
