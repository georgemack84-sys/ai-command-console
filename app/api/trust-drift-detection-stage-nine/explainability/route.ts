import { NextResponse } from "next/server";
import { explainabilityRequest, requireTrustDriftDetectionStageNineUser } from "../core";

export async function GET() { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await explainabilityRequest()); }
export async function POST(request: Request) { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await explainabilityRequest(request)); }
