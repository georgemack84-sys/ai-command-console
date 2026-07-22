import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requirePlatformCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformCertificationUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF certification lifecycle."); } }
export async function POST(request: Request) { try { await requirePlatformCertificationUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF certification lifecycle."); } }
