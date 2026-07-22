import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAuroraUser, securityRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await securityRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora security."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await securityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora security."); } }
