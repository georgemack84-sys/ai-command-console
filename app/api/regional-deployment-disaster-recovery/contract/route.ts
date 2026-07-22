import { contractResponse, requireRegionalDeploymentDisasterRecoveryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Regional Deployment Disaster Recovery contract."); } }
