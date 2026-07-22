import { apiError, apiSuccess } from "@/src/server/api/response";
import { ownershipRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await ownershipRequest()); } catch (error) { return apiError(error, "Unable to validate strategic ownership."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await ownershipRequest(request)); } catch (error) { return apiError(error, "Unable to validate strategic ownership."); } }
