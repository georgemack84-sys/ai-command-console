import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireAutonomyClassificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAutonomyClassificationUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect autonomy classification registry."); } }
export async function POST(request: Request) { try { await requireAutonomyClassificationUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to project autonomy classification registry."); } }
