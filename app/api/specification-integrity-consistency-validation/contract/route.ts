import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSpecificationIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationIntegrityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect specification integrity validation."); } }
