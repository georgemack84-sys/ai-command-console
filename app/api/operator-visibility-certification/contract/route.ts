import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireOperatorVisibilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOperatorVisibilityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve operator visibility certification contract."); } }
