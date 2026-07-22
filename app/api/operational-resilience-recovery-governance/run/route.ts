import { requireOperationalResilienceRecoveryGovernanceUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Operational Resilience Recovery Governance."); } }
export async function POST(request: Request) { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Operational Resilience Recovery Governance."); } }
