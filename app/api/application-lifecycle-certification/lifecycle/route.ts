import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireApplicationLifecycleCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to inspect application lifecycle."); } }
export async function POST(request: Request) { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application lifecycle."); } }
