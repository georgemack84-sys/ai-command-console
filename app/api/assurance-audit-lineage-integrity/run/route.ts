import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAssuranceAuditUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run assurance audit lineage integrity."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run assurance audit lineage integrity."); } }
