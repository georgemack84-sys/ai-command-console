import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProgressiveDeliveryUser, shadowRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgressiveDeliveryUser(); return apiSuccess(await shadowRequest()); } catch (error) { return apiError(error, "Unable to load shadow execution."); } }
export async function POST(request: Request) { try { await requireProgressiveDeliveryUser(); return apiSuccess(await shadowRequest(request)); } catch (error) { return apiError(error, "Unable to load shadow execution."); } }
