import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to retrieve assurance integrity validation."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve assurance integrity validation."); } }
