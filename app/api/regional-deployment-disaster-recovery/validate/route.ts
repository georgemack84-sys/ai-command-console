import { requireRegionalDeploymentDisasterRecoveryUser, validateRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function POST(request: Request) { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Regional Deployment Disaster Recovery."); } }
