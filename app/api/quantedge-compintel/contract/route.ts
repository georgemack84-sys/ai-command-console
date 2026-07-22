import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireQciUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect QCI contract."); } }
