import { apiError, apiSuccess } from "@/src/server/api/response";
import { originsRequest, requireStrategicFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicFoundationUser(); return apiSuccess(await originsRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic origins and source of truth."); } }
export async function POST(request: Request) { try { await requireStrategicFoundationUser(); return apiSuccess(await originsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic origins and source of truth."); } }
