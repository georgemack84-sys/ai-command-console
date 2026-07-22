import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireConsumerAdoptionMigrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF consumer readiness."); } }
export async function POST(request: Request) { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF consumer readiness."); } }
