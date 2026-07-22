import { apisRequest, requireAuroraUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await apisRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora APIs."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await apisRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora APIs."); } }
