import { ledgerRequest, requireGlobalWorkloadDistributionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution ledger."); } }
export async function POST(request: Request) { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution ledger."); } }
