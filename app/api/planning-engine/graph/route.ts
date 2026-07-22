import { NextResponse } from "next/server";
import { graphRequest, requirePlanningEngineUser } from "../core";

export async function GET() { await requirePlanningEngineUser(); return NextResponse.json(await graphRequest()); }
export async function POST(request: Request) { await requirePlanningEngineUser(); return NextResponse.json(await graphRequest(request)); }
