import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConsumerAdoptionMigrationUser, rolloutRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await rolloutRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF rollout governance."); } }
export async function POST(request: Request) { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await rolloutRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF rollout governance."); } }
