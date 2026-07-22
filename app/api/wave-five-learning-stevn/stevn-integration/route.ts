import { NextResponse } from "next/server";
import { requireWaveFiveLearningStevnUser, stevnIntegrationRequest } from "../core";

export async function GET() { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await stevnIntegrationRequest()); }
export async function POST(request: Request) { await requireWaveFiveLearningStevnUser(); return NextResponse.json(await stevnIntegrationRequest(request)); }
