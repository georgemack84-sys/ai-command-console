import { NextResponse } from "next/server";
import { alertsRequest, requireTrustDriftDetectionStageNineUser } from "../core";

export async function GET() { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await alertsRequest()); }
export async function POST(request: Request) { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await alertsRequest(request)); }
