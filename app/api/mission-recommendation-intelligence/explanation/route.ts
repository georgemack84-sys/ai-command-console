import { NextResponse } from "next/server";
import { explanationRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await explanationRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await explanationRequest(request)); }
