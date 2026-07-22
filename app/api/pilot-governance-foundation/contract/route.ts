import { contractResponse, requirePilotGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Pilot Governance contract."); } }
