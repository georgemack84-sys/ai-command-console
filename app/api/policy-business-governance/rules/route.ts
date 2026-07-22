import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePbgUser, rulesRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(await rulesRequest()); } catch (error) { return apiError(error, "Unable to inspect PBG business rules."); } }
export async function POST(request: Request) { try { await requirePbgUser(); return apiSuccess(await rulesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect PBG business rules."); } }
