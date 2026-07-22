import { apiError, apiSuccess } from "@/src/server/api/response";
import { promotionRequest, requireApplicationFactoryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireApplicationFactoryUser(); return apiSuccess(await promotionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Application Factory promotion."); } }
