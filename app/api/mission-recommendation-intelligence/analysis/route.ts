import { NextResponse } from "next/server";
import { analysisRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await analysisRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await analysisRequest(request)); }
