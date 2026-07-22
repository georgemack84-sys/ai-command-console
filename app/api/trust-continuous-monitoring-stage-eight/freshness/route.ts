import { NextResponse } from "next/server";
import { freshnessRequest, requireTrustContinuousMonitoringStageEightUser } from "../core";

export async function GET() { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await freshnessRequest()); }
export async function POST(request: Request) { await requireTrustContinuousMonitoringStageEightUser(); return NextResponse.json(await freshnessRequest(request)); }
