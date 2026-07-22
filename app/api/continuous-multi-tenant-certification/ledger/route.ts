import { ledgerRequest, requireContinuousMultiTenantCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read certification ledger."); } }
export async function POST(request: Request) { try { await requireContinuousMultiTenantCertificationUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read certification ledger."); } }
