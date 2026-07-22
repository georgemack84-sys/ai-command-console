import { ledgerRequest, requireOperationalSafetyUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalSafetyUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Operational Safety ledger."); } }
export async function POST(request: Request) { try { await requireOperationalSafetyUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Operational Safety ledger."); } }
