import { authorizationRequest, requireRegionalDeploymentDisasterRecoveryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await authorizationRequest()); } catch (error) { return apiError(error, "Unable to read recovery authorization."); } }
export async function POST(request: Request) { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await authorizationRequest(request)); } catch (error) { return apiError(error, "Unable to read recovery authorization."); } }
