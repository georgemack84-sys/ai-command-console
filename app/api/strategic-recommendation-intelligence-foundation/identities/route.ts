import { apiError, apiSuccess } from "@/src/server/api/response";
import { identitiesRequest, requireStrategicFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicFoundationUser(); return apiSuccess(await identitiesRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic artifact identities."); } }
export async function POST(request: Request) { try { await requireStrategicFoundationUser(); return apiSuccess(await identitiesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic artifact identities."); } }
