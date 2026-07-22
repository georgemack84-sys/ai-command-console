import { apiError, apiSuccess } from "@/src/server/api/response";
import { completenessRequest, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await completenessRequest()); } catch (error) { return apiError(error, "Unable to validate assurance audit completeness."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await completenessRequest(request)); } catch (error) { return apiError(error, "Unable to validate assurance audit completeness."); } }
