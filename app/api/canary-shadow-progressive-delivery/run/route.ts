import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProgressiveDeliveryUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgressiveDeliveryUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run progressive delivery governance."); } }
export async function POST(request: Request) { try { await requireProgressiveDeliveryUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run progressive delivery governance."); } }
