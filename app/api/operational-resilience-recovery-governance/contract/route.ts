import { contractResponse, requireOperationalResilienceRecoveryGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Operational Resilience Recovery Governance contract."); } }
