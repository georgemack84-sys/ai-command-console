import { ledgerRequest, requireOperationalEvolutionKnowledgeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read Operational Evolution ledger."); } }
export async function POST(request: Request) { try { await requireOperationalEvolutionKnowledgeUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read Operational Evolution ledger."); } }
