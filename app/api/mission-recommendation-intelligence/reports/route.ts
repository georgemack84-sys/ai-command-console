import { NextResponse } from "next/server";
import { reportsRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await reportsRequest(request)); }
