import { apiError, apiSuccess } from "@/src/server/api/response";
import { exposureRequest, requireProgressiveDeliveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgressiveDeliveryUser(); return apiSuccess(await exposureRequest()); } catch (error) { return apiError(error, "Unable to load exposure policy."); } }
export async function POST(request: Request) { try { await requireProgressiveDeliveryUser(); return apiSuccess(await exposureRequest(request)); } catch (error) { return apiError(error, "Unable to load exposure policy."); } }
