import { NextResponse } from "next/server";
import { progressKnowledgeMissionRequest, requireWaveFiveLearningStevnUser } from "../core";

export async function GET() { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await progressKnowledgeMissionRequest()); }
export async function POST(request: Request) { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await progressKnowledgeMissionRequest(request)); }
