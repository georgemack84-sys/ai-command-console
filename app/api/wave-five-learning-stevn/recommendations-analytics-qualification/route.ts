import { NextResponse } from "next/server";
import { recommendationsAnalyticsQualificationRequest, requireWaveFiveLearningStevnUser } from "../core";

export async function GET() { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await recommendationsAnalyticsQualificationRequest()); }
export async function POST(request: Request) { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await recommendationsAnalyticsQualificationRequest(request)); }
