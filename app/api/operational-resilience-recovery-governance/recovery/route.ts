import { recoveryRequest, requireOperationalResilienceRecoveryGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await recoveryRequest()); } catch (error) { return apiError(error, "Unable to read operational recovery."); } }
export async function POST(request: Request) { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await recoveryRequest(request)); } catch (error) { return apiError(error, "Unable to read operational recovery."); } }
