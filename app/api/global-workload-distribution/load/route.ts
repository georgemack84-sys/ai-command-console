import { loadRequest, requireGlobalWorkloadDistributionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await loadRequest()); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution load engine."); } }
export async function POST(request: Request) { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await loadRequest(request)); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution load engine."); } }
