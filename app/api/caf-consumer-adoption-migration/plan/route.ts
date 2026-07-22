import { apiError, apiSuccess } from "@/src/server/api/response";
import { planRequest, requireConsumerAdoptionMigrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await planRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF migration plan."); } }
export async function POST(request: Request) { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await planRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF migration plan."); } }
