import { NextResponse } from "next/server";
import { lifecycleRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await lifecycleRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await lifecycleRequest(request)); }
