import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect APEX contract."); } }
