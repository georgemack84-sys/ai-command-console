import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProductionBoundaryUser, violationsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionBoundaryUser(); return apiSuccess(await violationsRequest()); } catch (error) { return apiError(error, "Unable to load production boundary violations."); } }
export async function POST(request: Request) { try { await requireProductionBoundaryUser(); return apiSuccess(await violationsRequest(request)); } catch (error) { return apiError(error, "Unable to load production boundary violations."); } }
