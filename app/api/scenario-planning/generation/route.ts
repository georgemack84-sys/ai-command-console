import { NextResponse } from "next/server";
import { generationRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await generationRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await generationRequest(request)); }
