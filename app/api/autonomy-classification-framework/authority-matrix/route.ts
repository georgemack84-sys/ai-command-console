import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityMatrixRequest, requireAutonomyClassificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAutonomyClassificationUser(); return apiSuccess(await authorityMatrixRequest()); } catch (error) { return apiError(error, "Unable to inspect autonomy authority matrix."); } }
export async function POST(request: Request) { try { await requireAutonomyClassificationUser(); return apiSuccess(await authorityMatrixRequest(request)); } catch (error) { return apiError(error, "Unable to project autonomy authority matrix."); } }
