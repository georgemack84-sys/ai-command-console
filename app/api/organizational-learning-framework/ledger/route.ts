import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireOrganizationalLearningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOrganizationalLearningUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to retrieve organizational learning ledger."); } }
export async function POST(request: Request) { try { await requireOrganizationalLearningUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect organizational learning ledger."); } }
