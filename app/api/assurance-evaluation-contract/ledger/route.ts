import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireAssuranceEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceEvaluationUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation ledger."); } }
export async function POST(request: Request) { try { await requireAssuranceEvaluationUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect assurance evaluation ledger."); } }
