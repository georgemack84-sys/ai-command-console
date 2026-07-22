import { requireRegionalDeploymentDisasterRecoveryUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Regional Deployment Disaster Recovery."); } }
export async function POST(request: Request) { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Regional Deployment Disaster Recovery."); } }
