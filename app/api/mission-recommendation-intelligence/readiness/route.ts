import { NextResponse } from "next/server";
import { readinessRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await readinessRequest(request)); }
