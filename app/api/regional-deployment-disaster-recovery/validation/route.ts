import { requireRegionalDeploymentDisasterRecoveryUser, validationRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await validationRequest()); } catch (error) { return apiError(error, "Unable to read recovery validation."); } }
export async function POST(request: Request) { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await validationRequest(request)); } catch (error) { return apiError(error, "Unable to read recovery validation."); } }
