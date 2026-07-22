import { apiError, apiSuccess } from "@/src/server/api/response";
import { catalogRequest, requirePbgUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(await catalogRequest()); } catch (error) { return apiError(error, "Unable to inspect PBG catalog."); } }
export async function POST(request: Request) { try { await requirePbgUser(); return apiSuccess(await catalogRequest(request)); } catch (error) { return apiError(error, "Unable to inspect PBG catalog."); } }
