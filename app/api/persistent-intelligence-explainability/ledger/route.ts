import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to inspect explainability ledger."); } }
export async function POST(request: Request) { try { await requireExplainabilityUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect explainability ledger."); } }
