import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireSpecificationIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification integrity ledger."); } }
export async function POST(request: Request) { try { await requireSpecificationIntegrityUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification integrity ledger."); } }
