import { requireCrossRegionReplicationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireCrossRegionReplicationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Cross Region Replication."); } }
export async function POST(request: Request) { try { await requireCrossRegionReplicationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Cross Region Replication."); } }
