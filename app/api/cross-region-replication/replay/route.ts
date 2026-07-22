import { replayRequest, requireCrossRegionReplicationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireCrossRegionReplicationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to read replication replay synchronization."); } }
export async function POST(request: Request) { try { await requireCrossRegionReplicationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to read replication replay synchronization."); } }
