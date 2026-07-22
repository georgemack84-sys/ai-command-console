import { NextResponse } from "next/server";
import { prioritizationRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await prioritizationRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await prioritizationRequest(request)); }
