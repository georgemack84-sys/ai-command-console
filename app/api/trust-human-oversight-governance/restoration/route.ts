import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustHumanOversightUser, restorationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustHumanOversightUser(); return apiSuccess(await restorationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Restoration Approval."); } }
export async function POST(request: Request) { try { await requireTrustHumanOversightUser(); return apiSuccess(await restorationRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Restoration Approval."); } }
