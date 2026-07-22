import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConsumerAdoptionMigrationUser, transitionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await transitionRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF transition management."); } }
export async function POST(request: Request) { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await transitionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF transition management."); } }
