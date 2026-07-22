import { NextResponse } from "next/server";
import { assessmentStudyRequest, requireWaveFiveLearningStevnUser } from "../core";

export async function GET() { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await assessmentStudyRequest()); }
export async function POST(request: Request) { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await assessmentStudyRequest(request)); }
