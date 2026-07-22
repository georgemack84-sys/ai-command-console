import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePublisherUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Publisher OS contract."); } }
