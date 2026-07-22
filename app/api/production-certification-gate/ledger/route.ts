import { ledgerRequest, requireProductionCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load production certification ledger."); } }
export async function POST(request: Request) { try { await requireProductionCertificationUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load production certification ledger."); } }
