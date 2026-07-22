import { ledgerRequest, requireResourceSchedulingCapacityManagementUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load allocation ledger."); } }
export async function POST(request: Request) { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load allocation ledger."); } }
