import { requireGlobalWorkloadDistributionUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Global Workload Distribution."); } }
export async function POST(request: Request) { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Global Workload Distribution."); } }
