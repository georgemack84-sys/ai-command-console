import { contractResponse, requireAdaptiveGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Adaptive Governance contract."); } }
