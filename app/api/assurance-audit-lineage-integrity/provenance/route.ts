import { apiError, apiSuccess } from "@/src/server/api/response";
import { provenanceRequest, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await provenanceRequest()); } catch (error) { return apiError(error, "Unable to retrieve assurance provenance service."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await provenanceRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve assurance provenance service."); } }
