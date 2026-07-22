import { deploymentRequest, requireRegionalDeploymentDisasterRecoveryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await deploymentRequest()); } catch (error) { return apiError(error, "Unable to read regional deployment recovery status."); } }
export async function POST(request: Request) { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await deploymentRequest(request)); } catch (error) { return apiError(error, "Unable to read regional deployment recovery status."); } }
