import { NextResponse } from "next/server";
import { feedRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await feedRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await feedRequest(request)); }
