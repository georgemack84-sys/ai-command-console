import { certificationRequest, requireRegionalDeploymentDisasterRecoveryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read disaster recovery certification."); } }
export async function POST(request: Request) { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read disaster recovery certification."); } }
