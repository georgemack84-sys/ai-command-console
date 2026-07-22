import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApplicationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationFoundationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect application constitutional foundation contract."); } }
