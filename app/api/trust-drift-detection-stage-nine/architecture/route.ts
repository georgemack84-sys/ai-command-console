import { NextResponse } from "next/server";
import { architectureRequest, requireTrustDriftDetectionStageNineUser } from "../core";

export async function GET() { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await architectureRequest(request)); }
