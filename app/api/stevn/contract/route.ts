import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStevnUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStevnUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect STEVN Application contract."); } }
