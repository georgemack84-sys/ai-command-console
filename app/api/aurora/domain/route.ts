import { apiError, apiSuccess } from "@/src/server/api/response";
import { domainRequest, requireAuroraUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await domainRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora domain services."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await domainRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora domain services."); } }
