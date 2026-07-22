import { NextResponse } from "next/server";
import { apisRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await apisRequest(request)); }
