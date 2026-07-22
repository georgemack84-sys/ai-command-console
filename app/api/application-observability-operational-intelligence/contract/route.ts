import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApplicationOperationalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationOperationalUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect application operational intelligence contract."); } }
