import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect assurance audit lineage integrity contract."); } }
