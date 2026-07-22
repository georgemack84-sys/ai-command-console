import { NextResponse } from "next/server";
import { engineRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await engineRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await engineRequest(request)); }
