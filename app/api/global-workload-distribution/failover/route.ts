import { failoverRequest, requireGlobalWorkloadDistributionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await failoverRequest()); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution failover routing."); } }
export async function POST(request: Request) { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await failoverRequest(request)); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution failover routing."); } }
