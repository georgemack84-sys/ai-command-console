import { NextResponse } from "next/server";
import { generationRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await generationRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await generationRequest(request)); }
