import { requireGlobalWorkloadDistributionUser, routerRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await routerRequest()); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution router."); } }
export async function POST(request: Request) { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await routerRequest(request)); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution router."); } }
