import { requireGlobalWorkloadDistributionUser, retryRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await retryRequest()); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution retry policy."); } }
export async function POST(request: Request) { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await retryRequest(request)); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution retry policy."); } }
