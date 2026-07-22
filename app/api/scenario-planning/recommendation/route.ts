import { NextResponse } from "next/server";
import { recommendationRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await recommendationRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await recommendationRequest(request)); }
