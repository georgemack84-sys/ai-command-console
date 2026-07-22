import { ledgerRequest, requireProductionAdvisoryRuntimeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime ledger."); } }
export async function POST(request: Request) { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime ledger."); } }
