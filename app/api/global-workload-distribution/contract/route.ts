import { contractResponse, requireGlobalWorkloadDistributionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution contract."); } }
