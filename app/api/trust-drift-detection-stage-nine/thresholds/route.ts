import { NextResponse } from "next/server";
import { requireTrustDriftDetectionStageNineUser, thresholdsRequest } from "../core";

export async function GET() { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await thresholdsRequest()); }
export async function POST(request: Request) { await requireTrustDriftDetectionStageNineUser(); return NextResponse.json(await thresholdsRequest(request)); }
