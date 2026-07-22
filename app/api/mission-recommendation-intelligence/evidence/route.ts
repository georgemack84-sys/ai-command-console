import { NextResponse } from "next/server";
import { evidenceRequest, requireMissionRecommendationUser } from "../core";

export async function GET() { await requireMissionRecommendationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireMissionRecommendationUser(); return NextResponse.json(await evidenceRequest(request)); }
