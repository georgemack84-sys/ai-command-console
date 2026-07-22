import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireCertificationDecisionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCertificationDecisionUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to inspect certification decision ledger."); } }
export async function POST(request: Request) { try { await requireCertificationDecisionUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect certification decision ledger."); } }
