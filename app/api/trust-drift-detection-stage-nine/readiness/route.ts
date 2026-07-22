import { NextResponse } from "next/server";
import { readinessRequest, requireTrustDriftDetectionStageNineUser } from "../core";

export async function GET() { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await readinessRequest(request)); }
