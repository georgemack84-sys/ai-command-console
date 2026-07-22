import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireKnowledgeLifecycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to retrieve lifecycle ledger."); } }
export async function POST(request: Request) { try { await requireKnowledgeLifecycleUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect lifecycle ledger."); } }
