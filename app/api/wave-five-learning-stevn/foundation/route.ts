import { NextResponse } from "next/server";
import { foundationRequest, requireWaveFiveLearningStevnUser } from "../core";

export async function GET() { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await foundationRequest()); }
export async function POST(request: Request) { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await foundationRequest(request)); }
