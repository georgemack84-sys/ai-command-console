import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireApplicationFactoryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationFactoryUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Application Factory contract."); } }
