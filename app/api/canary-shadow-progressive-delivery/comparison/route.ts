import { comparisonRequest, requireProgressiveDeliveryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProgressiveDeliveryUser(); return apiSuccess(await comparisonRequest()); } catch (error) { return apiError(error, "Unable to load production comparison."); } }
export async function POST(request: Request) { try { await requireProgressiveDeliveryUser(); return apiSuccess(await comparisonRequest(request)); } catch (error) { return apiError(error, "Unable to load production comparison."); } }
