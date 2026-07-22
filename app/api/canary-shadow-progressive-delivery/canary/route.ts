import { apiError, apiSuccess } from "@/src/server/api/response";
import { canaryRequest, requireProgressiveDeliveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgressiveDeliveryUser(); return apiSuccess(await canaryRequest()); } catch (error) { return apiError(error, "Unable to load canary deployment."); } }
export async function POST(request: Request) { try { await requireProgressiveDeliveryUser(); return apiSuccess(await canaryRequest(request)); } catch (error) { return apiError(error, "Unable to load canary deployment."); } }
