import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireExplainabilityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect persistent intelligence explainability contract."); } }
