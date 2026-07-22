import { NextResponse } from "next/server";
import { requireTrustDriftDetectionStageNineUser, riskRequest } from "../core";

export async function GET() { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await riskRequest()); }
export async function POST(request: Request) { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await riskRequest(request)); }
