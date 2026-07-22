import { ledgerRequest, requireContinuousAssuranceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousAssuranceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Production Certification Ledger."); } }
export async function POST(request: Request) { try { await requireContinuousAssuranceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Certification Ledger."); } }
