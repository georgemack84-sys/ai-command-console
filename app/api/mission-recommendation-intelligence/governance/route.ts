import { NextResponse } from "next/server";
import { governanceRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await governanceRequest(request)); }
