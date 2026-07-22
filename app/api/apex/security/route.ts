import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApexUser, securityRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await securityRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX security."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await securityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX security."); } }
