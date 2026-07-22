import { NextResponse } from "next/server";
import { alignmentRequest, requireTrustDriftDetectionStageNineUser } from "../core";

export async function GET() { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await alignmentRequest()); }
export async function POST(request: Request) { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await alignmentRequest(request)); }
