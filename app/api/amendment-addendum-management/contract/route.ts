import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAmendmentAddendumUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect amendment addendum management."); } }
