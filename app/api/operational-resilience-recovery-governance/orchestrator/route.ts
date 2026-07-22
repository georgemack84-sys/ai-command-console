import { orchestratorRequest, requireOperationalResilienceRecoveryGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await orchestratorRequest()); } catch (error) { return apiError(error, "Unable to read resilience orchestrator."); } }
export async function POST(request: Request) { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await orchestratorRequest(request)); } catch (error) { return apiError(error, "Unable to read resilience orchestrator."); } }
