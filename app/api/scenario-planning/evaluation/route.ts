import { NextResponse } from "next/server";
import { evaluationRequest, requireScenarioPlanningUser } from "../core";

export async function GET() { await requireScenarioPlanningUser(); return NextResponse.json(await evaluationRequest()); }
export async function POST(request: Request) { await requireScenarioPlanningUser(); return NextResponse.json(await evaluationRequest(request)); }
