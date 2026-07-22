import { queueRequest, requireGlobalWorkloadDistributionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await queueRequest()); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution queue."); } }
export async function POST(request: Request) { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await queueRequest(request)); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution queue."); } }
