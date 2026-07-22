import { contractResponse, requirePilotExpansionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance contract."); } }
