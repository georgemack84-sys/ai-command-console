import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireRetrievalIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to retrieve retrieval intelligence ledger."); } }
export async function POST(request: Request) { try { await requireRetrievalIntelligenceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect retrieval intelligence ledger."); } }
