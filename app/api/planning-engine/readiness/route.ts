import { NextResponse } from "next/server";
import { readinessRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await readinessRequest(request)); }
