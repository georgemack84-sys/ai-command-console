import { ledgerRequest, requireRegionalDeploymentDisasterRecoveryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read recovery ledger."); } }
export async function POST(request: Request) { try { await requireRegionalDeploymentDisasterRecoveryUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read recovery ledger."); } }
