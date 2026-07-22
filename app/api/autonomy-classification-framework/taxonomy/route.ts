import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyClassificationUser, taxonomyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAutonomyClassificationUser(); return apiSuccess(await taxonomyRequest()); } catch (error) { return apiError(error, "Unable to inspect autonomy taxonomy."); } }
export async function POST(request: Request) { try { await requireAutonomyClassificationUser(); return apiSuccess(await taxonomyRequest(request)); } catch (error) { return apiError(error, "Unable to project autonomy taxonomy."); } }
