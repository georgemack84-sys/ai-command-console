import { apiError, apiSuccess } from "@/src/server/api/response";
import { organizationRequest, requirePbgUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(await organizationRequest()); } catch (error) { return apiError(error, "Unable to inspect PBG organization model."); } }
export async function POST(request: Request) { try { await requirePbgUser(); return apiSuccess(await organizationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect PBG organization model."); } }
