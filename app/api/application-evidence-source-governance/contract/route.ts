import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApplicationEvidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationEvidenceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect application evidence source governance contract."); } }
