import { NextResponse } from "next/server";
import { behaviorRequest, requireTrustContinuousMonitoringStageEightUser } from "../core";

export async function GET() { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await behaviorRequest()); }
export async function POST(request: Request) { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await behaviorRequest(request)); }
