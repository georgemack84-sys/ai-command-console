import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireStrategicFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicFoundationUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic referential integrity."); } }
export async function POST(request: Request) { try { await requireStrategicFoundationUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic referential integrity."); } }
