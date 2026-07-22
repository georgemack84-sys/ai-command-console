import { recoveryRequest, requireRegionalDeploymentDisasterRecoveryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await recoveryRequest()); } catch (error) { return apiError(error, "Unable to read disaster recovery execution."); } }
export async function POST(request: Request) { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await recoveryRequest(request)); } catch (error) { return apiError(error, "Unable to read disaster recovery execution."); } }
