import { containmentRequest, requireOperationalResilienceRecoveryGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await containmentRequest()); } catch (error) { return apiError(error, "Unable to read failure containment."); } }
export async function POST(request: Request) { try { await requireOperationalResilienceRecoveryGovernanceUser(); return apiSuccess(await containmentRequest(request)); } catch (error) { return apiError(error, "Unable to read failure containment."); } }
