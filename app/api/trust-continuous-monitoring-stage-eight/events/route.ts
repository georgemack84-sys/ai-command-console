import { NextResponse } from "next/server";
import { eventsRequest, requireTrustContinuousMonitoringStageEightUser } from "../core";

export async function GET() { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await eventsRequest()); }
export async function POST(request: Request) { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await eventsRequest(request)); }
