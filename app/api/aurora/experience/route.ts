import { apiError, apiSuccess } from "@/src/server/api/response";
import { experienceRequest, requireAuroraUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await experienceRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora experience."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await experienceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora experience."); } }
